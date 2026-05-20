import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';
import { OrdersGateway } from '../gateway/orders.gateway';
import { StockService } from 'src/stock/stock.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrdersGateway,
    private stockService: StockService,
  ) {}

  async create(dto: CreateOrderDto) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: dto.sessionId },
      include: { restaurant: true },
    });
    if (!session) throw new NotFoundException('Sessão de mesa não encontrada.');
    if (session.status === 'CLOSED')
      throw new BadRequestException('Esta mesa já foi encerrada.');

    const uniqueItemIds = [...new Set(dto.items.map((i) => i.menuItemId))];

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: uniqueItemIds },
        available: true,
      },
    });

    if (menuItems.length !== uniqueItemIds.length)
      throw new BadRequestException(
        'Um ou mais itens estão indisponíveis ou não existem.',
      );

    const order = await this.prisma.order.create({
      data: {
        sessionId: dto.sessionId,
        guestId: dto.guestId,
        items: {
          create: dto.items.map((item) => {
            const menuItem = menuItems.find((m) => m.id === item.menuItemId);
            if (!menuItem) {
              throw new BadRequestException(
                'Item indisponível ou inexistente.',
              );
            }
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              notes: item.notes,
              price: menuItem.price,
            };
          }),
        },
        statusHistory: {
          create: { status: OrderStatus.WAITING },
        },
      },
      include: {
        items: { include: { menuItem: true } },
        statusHistory: true,
        session: { include: { table: true } },
      },
    });

    // Notifica cozinha, bar e gestor em tempo real
    this.gateway.notifyNewOrder(session.restaurantId, order, dto.sessionId);

    return order;
  }

  async findBySession(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      include: {
        items: { include: { menuItem: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByRestaurant(restaurantId: string, date?: string) {
    const start = date ? new Date(date) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        session: { restaurantId },
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true, waiter: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        session: { include: { table: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.findOne(id);

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        statusHistory: {
          create: { status: dto.status },
        },
      },
      include: {
        items: { include: { menuItem: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        session: { include: { table: true } },
      },
    });

    if (dto.status === OrderStatus.DELIVERED) {
      await this.stockService.deductByOrder(id);
    }

    // Notifica cliente e gestor em tempo real
    this.gateway.notifyOrderStatusUpdate(
      existing.session.restaurantId,
      existing.sessionId,
      order,
    );

    return order;
  }

  async cancel(id: string) {
    return this.updateStatus(id, { status: OrderStatus.CANCELLED });
  }
}
