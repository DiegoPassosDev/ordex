import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { AssignWaiterDto } from './dto/assign-waiter.dto';
import { OrdersGateway } from '../gateway/orders.gateway';

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

    // Se já existe sessão aberta, vincula o guest (caso ainda não esteja) e retorna
    if (existing) {
      if (dto.guestId) {
        await this.prisma.tableSession.update({
          where: { id: existing.id },
          data: { guests: { connect: { id: dto.guestId } } },
        });
      }
      return existing;
    }

    const session = await this.prisma.tableSession.create({
      data: {
        tableId: dto.tableId,
        restaurantId: dto.restaurantId,
        // Conecta o guest na criação, se informado
        ...(dto.guestId && {
          guests: { connect: { id: dto.guestId } },
        }),
      },
      include: { table: true },
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
        guests: true,         // ← inclui os guests vinculados à sessão
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

  async requestBill(id: string) {
    const session = await this.findOne(id);
    if (session.status === 'CLOSED')
      throw new BadRequestException('Sessão já encerrada.');

    const updated = await this.prisma.tableSession.update({
      where: { id },
      data: { status: 'REQUESTING_BILL' },
      include: { table: true },
    });

    this.gateway.notifyBillRequest(session.restaurantId, id, updated);
    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);

    return updated;
  }

  async close(id: string) {
    const session = await this.findOne(id);

    const updated = await this.prisma.tableSession.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { table: true },
    });

    this.gateway.notifyTableSessionUpdate(session.restaurantId, updated);

    return updated;
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
}