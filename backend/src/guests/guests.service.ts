import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, user: { id?: string; role?: string }) {
    // Guests só podem ver os próprios dados
    if (user.role === 'GUEST' && user.id !== id) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const guest = await this.prisma.guest.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    if (!guest) throw new NotFoundException('Cliente não encontrado.');
    return guest;
  }
}
