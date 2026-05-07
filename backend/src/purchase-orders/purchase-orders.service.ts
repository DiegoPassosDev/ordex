import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  async create(data: {
    restaurantId: string;
    supplierId: string;
    notes?: string;
    expectedAt?: string;
    items: { stockItemId: string; quantity: number; costPerUnit: number }[];
  }) {
    const totalCost = data.items.reduce(
      (acc, i) => acc + i.quantity * i.costPerUnit,
      0,
    );

    return this.prisma.purchaseOrder.create({
      data: {
        restaurantId: data.restaurantId,
        supplierId: data.supplierId,
        notes: data.notes,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : undefined,
        totalCost,
        items: {
          create: data.items.map((i) => ({
            stockItemId: i.stockItemId,
            quantity: i.quantity,
            costPerUnit: i.costPerUnit,
            totalCost: i.quantity * i.costPerUnit,
          })),
        },
      },
      include: { supplier: true, items: { include: { stockItem: true } } },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, items: { include: { stockItem: true } } },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { stockItem: true } } },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.findOne(id);

    // Se recebido → dá entrada no estoque automaticamente
    if (status === 'RECEIVED' && order.status !== 'RECEIVED') {
      for (const item of order.items) {
        await this.stockService.createEntry({
          stockItemId: item.stockItemId,
          supplierId: order.supplierId,
          restaurantId: order.restaurantId,
          quantity: item.quantity,
          costPerUnit: item.costPerUnit,
          note: `Pedido de compra #${id.slice(0, 8)}`,
        });
      }
      return this.prisma.purchaseOrder.update({
        where: { id },
        data: { status: status as any, receivedAt: new Date() },
        include: { supplier: true, items: { include: { stockItem: true } } },
      });
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any },
      include: { supplier: true, items: { include: { stockItem: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
