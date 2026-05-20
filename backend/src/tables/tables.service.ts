import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTableDto) {
    const existing = await this.prisma.table.findFirst({
      where: {
        number: dto.number,
        restaurantId: dto.restaurantId,
      },
    });

    if (existing)
      throw new ConflictException(
        `Mesa ${dto.number} já existe neste restaurante.`,
      );

    const qrCode = `${dto.restaurantId}__table__${dto.number}__${randomUUID()}`;

    return this.prisma.table.create({
      data: {
        number: dto.number,
        restaurantId: dto.restaurantId,
        qrCode,
      },
    });
  }

  async findAllByRestaurant(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Mesa não encontrada.');
    return table;
  }

  async findByQrCode(qrCode: string) {
    const table = await this.prisma.table.findUnique({ where: { qrCode } });
    if (!table) throw new NotFoundException('QR Code inválido.');
    return table;
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeSession = await this.prisma.tableSession.findFirst({
      where: { tableId: id, status: { not: 'CLOSED' } },
      select: { id: true },
    });
    if (activeSession)
      throw new BadRequestException(
        'Não é possível excluir uma mesa com sessão ativa.',
      );

    return this.prisma.table.delete({ where: { id } });
  }
}
