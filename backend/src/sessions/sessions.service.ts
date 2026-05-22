import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { AssignWaiterDto } from './dto/assign-waiter.dto';
import { OrdersGateway } from '../gateway/orders.gateway';
import { RequestBillDto } from './dto/request-bill.dto';
import { RequestTableAccessDto } from './dto/request-table-access.dto';


@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrdersGateway,
  ) {}

  async open(dto: OpenSessionDto) {
    const existing = await this.prisma.tableSession.findFirst({
      where: { tableId: dto.tableId, status: { not: 'CLOSED' } },
    });

    if (existing) {
      const updateData: any = {};
      if (dto.guestId) {
        updateData.guests = { connect: { id: dto.guestId } };
      }
      if (dto.waiterId) {
        updateData.waiterId = dto.waiterId;
      }
      if (Object.keys(updateData).length > 0) {
        await this.prisma.tableSession.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      const updated = await this.findOne(existing.id);
      this.gateway.notifyTableSessionUpdate(updated.restaurantId, updated);
      return updated;
    }

    let guestId = dto.guestId;
    // Só cria guest temporário quando NÃO há garçom envolvido
    // (ex: cliente abrindo mesa direto pelo QR Code)
    if (dto.guestName && !guestId && !dto.waiterId) {
      const email = `mesa-${Date.now()}@local`;
      const guest = await this.prisma.guest.create({
        data: { name: dto.guestName, email, passwordHash: crypto.randomBytes(32).toString('hex') },
      });
      guestId = guest.id;
    }

    const session = await this.prisma.tableSession.create({
      data: {
        tableId: dto.tableId,
        restaurantId: dto.restaurantId,
        ...(dto.guestName && dto.waiterId && !guestId && { guestLabel: dto.guestName }),
        ...(guestId && {
          guests: { connect: { id: guestId } },
        }),
        ...(dto.waiterId && { waiterId: dto.waiterId }),
      },
      include: { table: true, waiter: true, guests: true },
    });

    this.gateway.notifyTableSessionUpdate(dto.restaurantId, session);

    return session;
  }

  async findOne(id: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: true,
        guests: true,
        orders: {
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada.');
    return session;
  }

  async findActiveByRestaurant(restaurantId: string) {
    return this.prisma.tableSession.findMany({
      where: { restaurantId, status: { not: 'CLOSED' } },
      include: {
        table: true,
        waiter: true,
        guests: true, // ← inclui os guests vinculados à sessão
        orders: {
          include: {
            items: { include: { menuItem: true } },
            guest: true,
          },
        },
      },
      orderBy: { openedAt: 'asc' },
    });
  }

  async assignWaiter(id: string, dto: AssignWaiterDto) {
    const session = await this.findOne(id);
    if (session.status === 'CLOSED')
      throw new BadRequestException('Sessão já encerrada.');

    const updated = await this.prisma.tableSession.update({
      where: { id },
      data: { waiterId: dto.waiterId },
      include: { table: true, waiter: true },
    });

    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);

    return updated;
  }

  async requestBill(id: string, dto: RequestBillDto) {
    const session = await this.findOne(id);

    if (session.status === 'CLOSED')
      throw new BadRequestException('Sessão já encerrada.');

    if (session.status === 'REQUESTING_BILL')
      throw new BadRequestException('Conta já foi solicitada.');

    // Calcula o subtotal dos pedidos não cancelados
    const subtotal = session.orders.reduce((acc, order) => {
      if (order.status === 'CANCELLED') return acc;
      return (
        acc + order.items.reduce((s, item) => s + item.price * item.quantity, 0)
      );
    }, 0);

    // Busca a taxa de serviço do restaurante
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
      select: { serviceCharge: true },
    });

    const serviceChargeRate = restaurant?.serviceCharge ?? 10;
    const serviceChargeAmount = dto.serviceChargeAccepted
      ? subtotal * (serviceChargeRate / 100)
      : 0;

    const total = subtotal + serviceChargeAmount;

    // Cria o Bill com status PENDING e a preferência do cliente
    // O caixa depois cria o Payment e fecha a sessão
    const bill = await this.prisma.bill.create({
      data: {
        sessionId: id,
        subtotal,
        serviceCharge: serviceChargeAmount,
        total,
        status: 'PENDING',
        preferredPaymentMethod: dto.preferredPaymentMethod,
      },
    });

    // Muda o status da sessão para REQUESTING_BILL
    // e guarda a preferência de pagamento nas notas do bill (via notes no Payment futuro)
    // A preferência fica disponível para o caixa via bill.session
    const updated = await this.prisma.tableSession.update({
      where: { id },
      data: {
        status: 'REQUESTING_BILL',
        // Guardamos a preferência como metadata no próprio update
        // O caixa lê via sessionsService.findOne que retorna o bill
      },
      include: { table: true },
    });

    // Notifica garçom, caixa e gestor
    this.gateway.notifyBillRequest(session.restaurantId, id, {
      ...updated,
      bill: {
        ...bill,
        preferredPaymentMethod: dto.preferredPaymentMethod,
        serviceChargeAccepted: dto.serviceChargeAccepted,
      },
    });
    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);

    return { session: updated, bill };
  }

  async close(id: string) {
    const session = await this.findOne(id);

    const updated = await this.prisma.tableSession.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { table: true },
    });

    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);

    this.gateway.notifySessionClosedByManager(id, {
      guestIds: session.guests.map((g) => g.id),
      tableNumber: session.table.number,
    });

    return updated;
  }

  async leaveSession(sessionId: string, guestId: string) {
    const session = await this.findOne(sessionId);
    if (session.status === 'CLOSED') return;

    const updated = await this.prisma.tableSession.update({
      where: { id: sessionId },
      data: { guests: { disconnect: { id: guestId } } },
      include: { table: true, guests: true }, // ← inclui guests para contar
    });

    // ✅ Se não sobrou nenhum guest, fecha a sessão automaticamente
    if (updated.guests.length === 0) {
      const closed = await this.prisma.tableSession.update({
        where: { id: sessionId },
        data: { status: 'CLOSED', closedAt: new Date() },
        include: { table: true },
      });
      this.gateway.notifyTableSessionUpdate(session.restaurantId, closed);
      return;
    }

    // Ainda tem guests — só notifica atualização
    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);
  }

  async callWaiter(id: string, reason: string) {
    const session = await this.findOne(id);
    if (session.status === 'CLOSED')
      throw new BadRequestException('Sessão já encerrada.');

    this.gateway.notifyWaiterCall(session.restaurantId, {
      sessionId: id,
      tableNumber: session.table.number,
      reason,
    });

    return { message: 'Garçom chamado com sucesso.' };
  }

  async getSessionTotal(id: string) {
    const session = await this.findOne(id);

    const total = session.orders.reduce((acc, order) => {
      if (order.status === 'CANCELLED') return acc;
      return (
        acc +
        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );
    }, 0);

    return { sessionId: id, total };
  }

  async requestAccess(sessionId: string, dto: RequestTableAccessDto) {
    const session = await this.findOne(sessionId);

    if (session.status === 'CLOSED')
      throw new BadRequestException('Sessão encerrada.');

    // Verifica se o guest já está na sessão
    const alreadyIn = session.guests?.some((g: any) => g.id === dto.guestId);
    if (alreadyIn) throw new BadRequestException('Você já está nesta mesa.');

    // Determina o owner: se não há guests, o garçom é o responsável
    let ownerId: string;
    if (session.guests && session.guests.length > 0) {
      ownerId = session.guests[0].id;
    } else if (session.waiterId) {
      ownerId = session.waiterId;
    } else {
      throw new BadRequestException('Nenhum responsável encontrado para esta mesa.');
    }

    // Verifica se já existe uma solicitação pendente deste guest
    const existing = await this.prisma.tableAccessRequest.findFirst({
      where: { sessionId, guestId: dto.guestId, status: 'PENDING' },
      include: { guest: true },
    });
    if (existing) {
      this.gateway.notifyAccessRequest(
        sessionId,
        {
          requestId: existing.id,
          guestId: dto.guestId,
          guestName: existing.guest.name,
          tableNumber: session.table.number,
          ownerId,
        },
        session.restaurantId,
      );

      return existing;
    }

    // Cria a solicitação
    const request = await this.prisma.tableAccessRequest.create({
      data: {
        sessionId,
        guestId: dto.guestId,
        ownerId,
        status: 'PENDING',
      },
      include: { guest: true },
    });

    // Notifica o responsável via WebSocket
    this.gateway.notifyAccessRequest(
      sessionId,
      {
        requestId: request.id,
        guestId: dto.guestId,
        guestName: request.guest.name,
        tableNumber: session.table.number,
        ownerId,
      },
      session.restaurantId,
    );

    return request;
  }

  async respondAccess(requestId: string, approved: boolean, userId: string) {
    const request = await this.prisma.tableAccessRequest.findUnique({
      where: { id: requestId },
      include: { session: { include: { table: true, guests: true } } },
    });

    if (!request) throw new NotFoundException('Solicitação não encontrada.');

    if (request.status !== 'PENDING')
      throw new BadRequestException('Solicitação já respondida.');

    // Verifica se quem está respondendo é o dono
    if (request.ownerId !== userId)
      throw new BadRequestException('Apenas o dono da mesa pode autorizar.');

    // Atualiza o status da solicitação
    const updated = await this.prisma.tableAccessRequest.update({
      where: { id: requestId },
      data: { status: approved ? 'APPROVED' : 'DENIED' },
    });

    // Se aprovado, conecta o guest à sessão
    if (approved) {
      await this.prisma.tableSession.update({
        where: { id: request.sessionId },
        data: { guests: { connect: { id: request.guestId } } },
      });

      // Notifica o restaurante sobre a atualização da sessão (novo hóspede)
      const session = await this.findOne(request.sessionId);
      this.gateway.notifyTableSessionUpdate(session.restaurantId, session);
    }

    // Notifica o solicitante via WebSocket
    this.gateway.notifyAccessResponse(request.sessionId, {
      requestId,
      approved,
      guestId: request.guestId,
    });

    return updated;
  }

  async findActiveByTable(tableId: string, guestId?: string) {
    const session = await this.prisma.tableSession.findFirst({
      where: { tableId, status: { not: 'CLOSED' } },
      include: {
        table: true,
        guests: true,
      },
    });

    if (!session) return null;

    const isMember = guestId && session.guests?.some((g) => g.id === guestId);

    if (isMember) return session;

    return {
      id: session.id,
      guestLabel: session.guestLabel || null,
      guests: session.guests?.length
        ? [{ name: session.guests[0].name || 'Responsável' }]
        : [],
    };
  }

  async getPendingAccessRequests(sessionId: string) {
    return this.prisma.tableAccessRequest.findMany({
      where: { sessionId, status: 'PENDING' },
      include: { guest: true },
    });
  }
}
