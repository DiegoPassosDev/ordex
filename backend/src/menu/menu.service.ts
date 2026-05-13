import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ── Categorias ────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async findCategoriesByRestaurant(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async removeCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return this.prisma.category.delete({ where: { id } });
  }

  // ── Itens ─────────────────────────────────────────────────────

  async createItem(dto: CreateMenuItemDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada.');

    return this.prisma.menuItem.create({ data: dto });
  }

  async findAllItems(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { category: { restaurantId } },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    await this.findOneItem(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Categoria não encontrada.');
    }

    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async toggleAvailability(id: string) {
    const item = await this.findOneItem(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { available: !item.available },
    });
  }

  async removeItem(id: string) {
    await this.findOneItem(id);
    return this.prisma.menuItem.delete({ where: { id } });
  }
}
