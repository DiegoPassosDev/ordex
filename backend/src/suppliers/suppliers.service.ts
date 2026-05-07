import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    restaurantId: string;
    name: string;
    phone?: string;
    email?: string;
    document?: string;
    notes?: string;
  }) {
    return this.prisma.supplier.create({ data });
  }

  async findAll(restaurantId: string) {
    return this.prisma.supplier.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado.');
    return supplier;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      document: string;
      notes: string;
      active: boolean;
    }>,
  ) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { active: false },
    });
  }
}
