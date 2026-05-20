import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    if (!guest) throw new NotFoundException('Cliente não encontrado.');
    return guest;
  }
}
