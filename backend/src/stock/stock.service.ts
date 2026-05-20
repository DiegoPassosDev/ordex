import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ── Itens ──
  async createItem(data: {
    restaurantId: string;
    name: string;
    unit: string;
    minQuantity?: number;
    costPerUnit?: number;
    category?: string;
  }) {
    return this.prisma.stockItem.create({ data: data as any });
  }

  async findAllItems(restaurantId: string) {
    return this.prisma.stockItem.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { ingredients: true } } },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: {
        entries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { supplier: true },
        },
        exits: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async updateItem(id: string, data: any) {
    return this.prisma.stockItem.update({ where: { id }, data });
  }

  async removeItem(id: string) {
    return this.prisma.stockItem.update({
      where: { id },
      data: { active: false },
    });
  }

  // ── Entradas ──
  async createEntry(data: {
    stockItemId: string;
    supplierId?: string;
    restaurantId: string;
    quantity: number;
    costPerUnit: number;
    note?: string;
    groupId?: string;
  }) {
    const totalCost = data.quantity * data.costPerUnit;

    const [entry] = await this.prisma.$transaction([
      this.prisma.stockEntry.create({ data: { ...data, totalCost } as any }),
      this.prisma.stockItem.update({
        where: { id: data.stockItemId },
        data: {
          quantity: { increment: data.quantity },
          costPerUnit: data.costPerUnit,
        },
      }),
    ]);
    return entry;
  }

  async createEntryGroup(data: {
    restaurantId: string;
    supplierId?: string;
    note?: string;
    items: { stockItemId: string; quantity: number; costPerUnit: number }[];
  }) {
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const entries = await Promise.all(
      data.items.map((item) =>
        this.createEntry({
          ...item,
          restaurantId: data.restaurantId,
          supplierId: data.supplierId,
          note: data.note,
          groupId,
        }),
      ),
    );

    return {
      groupId,
      entries,
      totalCost: entries.reduce((acc, e: any) => acc + e.totalCost, 0),
    };
  }

  async findEntries(restaurantId: string) {
    const entries = await this.prisma.stockEntry.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { stockItem: true, supplier: true },
    });

    // Agrupa por groupId
    const groups: Record<string, any> = {};
    const ungrouped: any[] = [];

    entries.forEach((entry: any) => {
      if (entry.groupId) {
        if (!groups[entry.groupId]) {
          groups[entry.groupId] = {
            groupId: entry.groupId,
            supplierId: entry.supplierId,
            supplier: entry.supplier,
            note: entry.note,
            createdAt: entry.createdAt,
            restaurantId: entry.restaurantId,
            items: [],
            totalCost: 0,
          };
        }
        groups[entry.groupId].items.push(entry);
        groups[entry.groupId].totalCost += entry.totalCost;
      } else {
        ungrouped.push({
          groupId: entry.id,
          supplier: entry.supplier,
          note: entry.note,
          createdAt: entry.createdAt,
          items: [entry],
          totalCost: entry.totalCost,
        });
      }
    });

    return [...Object.values(groups), ...ungrouped].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async updateEntry(
    id: string,
    data: {
      stockItemId?: string;
      supplierId?: string;
      quantity?: number;
      costPerUnit?: number;
      note?: string;
    },
  ) {
    const entry = await this.prisma.stockEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada.');

    const quantity = data.quantity ?? entry.quantity;
    const costPerUnit = data.costPerUnit ?? entry.costPerUnit;
    const totalCost = quantity * costPerUnit;

    return this.prisma.$transaction(async (tx) => {
      // Reverte a quantidade anterior no item de estoque
      await tx.stockItem.update({
        where: { id: entry.stockItemId },
        data: { quantity: { decrement: entry.quantity } },
      });

      // Aplica a nova quantidade
      await tx.stockItem.update({
        where: { id: data.stockItemId ?? entry.stockItemId },
        data: {
          quantity: { increment: quantity },
          costPerUnit: costPerUnit,
        },
      });

      return tx.stockEntry.update({
        where: { id },
        data: { ...data, totalCost } as any,
      });
    });
  }

  async removeEntry(id: string) {
    const entry = await this.prisma.stockEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada.');

    return this.prisma.$transaction(async (tx) => {
      // Reverte a quantidade no estoque antes de deletar
      await tx.stockItem.update({
        where: { id: entry.stockItemId },
        data: { quantity: { decrement: entry.quantity } },
      });

      return tx.stockEntry.delete({ where: { id } });
    });
  }
  // ── Saídas manuais ──
  async createExit(data: {
    stockItemId: string;
    quantity: number;
    reason?: string;
  }) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id: data.stockItemId },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');
    if (item.quantity < data.quantity)
      throw new BadRequestException('Estoque insuficiente.');

    const [exit] = await this.prisma.$transaction([
      this.prisma.stockExit.create({ data }),
      this.prisma.stockItem.update({
        where: { id: data.stockItemId },
        data: { quantity: { decrement: data.quantity } },
      }),
    ]);
    return exit;
  }

  async findExits(restaurantId: string) {
    return this.prisma.stockExit.findMany({
      where: { stockItem: { restaurantId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { stockItem: true },
    });
  }

  // ── Baixa automática por pedido ──
  async deductByOrder(orderId: string) {
    const alreadyDeducted = await this.prisma.stockExit.findFirst({
      where: { orderId },
      select: { id: true },
    });

    if (alreadyDeducted) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: { ingredients: { include: { stockItem: true } } },
            },
          },
        },
      },
    });
    if (!order) return;

    for (const orderItem of order.items) {
      for (const ingredient of orderItem.menuItem.ingredients) {
        const totalQty = ingredient.quantity * orderItem.quantity;
        // Converte: se receita em G e estoque em KG → divide por 1000
        const stockQty =
          ingredient.unit === 'G' && ingredient.stockItem.unit === 'KG'
            ? totalQty / 1000
            : ingredient.unit === 'ML' && ingredient.stockItem.unit === 'L'
              ? totalQty / 1000
              : totalQty;

        const currentItem = await this.prisma.stockItem.findUnique({
          where: { id: ingredient.stockItemId },
        });
        if (currentItem && currentItem.quantity >= stockQty) {
          await this.prisma.stockItem.update({
            where: { id: ingredient.stockItemId },
            data: { quantity: { decrement: stockQty } },
          });
          await this.prisma.stockExit.create({
            data: {
              stockItemId: ingredient.stockItemId,
              quantity: stockQty,
              reason: `Pedido #${orderId.slice(0, 8)}`,
              orderId,
            },
          });
        }
      }
    }
  }

  // ── Receitas ──
  async setIngredients(
    menuItemId: string,
    ingredients: { stockItemId: string; quantity: number; unit: string }[],
  ) {
    await this.prisma.menuItemIngredient.deleteMany({ where: { menuItemId } });
    return this.prisma.menuItemIngredient.createMany({
      data: ingredients.map((i) => ({ ...i, menuItemId, unit: i.unit as any })),
    });
  }

  async getIngredients(menuItemId: string) {
    return this.prisma.menuItemIngredient.findMany({
      where: { menuItemId },
      include: { stockItem: true },
    });
  }

  // ── Relatórios ──
  async getStockReport(restaurantId: string) {
    const items = await this.prisma.stockItem.findMany({
      where: { restaurantId, active: true },
      include: { _count: { select: { exits: true } } },
    });

    const lowStock = items.filter(
      (i) => i.quantity <= i.minQuantity && i.minQuantity > 0,
    );
    const totalValue = items.reduce(
      (acc, i) => acc + i.quantity * i.costPerUnit,
      0,
    );

    return { items, lowStock, totalValue, totalItems: items.length };
  }

  async getProfitReport(restaurantId: string) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: { category: { restaurantId } },
      include: {
        ingredients: { include: { stockItem: true } },
        category: true,
      },
    });

    return menuItems.map((item) => {
      const cost = item.ingredients.reduce((acc, ing) => {
        const unitCost =
          ing.unit === 'G' && ing.stockItem.unit === 'KG'
            ? ing.stockItem.costPerUnit / 1000
            : ing.unit === 'ML' && ing.stockItem.unit === 'L'
              ? ing.stockItem.costPerUnit / 1000
              : ing.stockItem.costPerUnit;
        return acc + ing.quantity * unitCost;
      }, 0);

      const profit = item.price - cost;
      const margin = item.price > 0 ? (profit / item.price) * 100 : 0;

      return {
        id: item.id,
        name: item.name,
        category: item.category.name,
        price: item.price,
        cost: parseFloat(cost.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        margin: parseFloat(margin.toFixed(1)),
        hasRecipe: item.ingredients.length > 0,
      };
    });
  }
}
