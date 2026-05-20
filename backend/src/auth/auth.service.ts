import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.guest.findUnique({
      where: { email: dto.email },
    });

    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const hash = await bcrypt.hash(dto.password, 10);

    const guest = await this.prisma.guest.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: hash,
      },
    });

    return this.signToken(guest.id, 'GUEST');
  }

  async login(dto: LoginDto) {
    const guest = await this.prisma.guest.findUnique({
      where: { email: dto.email },
    });

    if (!guest || !guest.passwordHash)
      throw new UnauthorizedException('Credenciais inválidas.');

    const valid = await bcrypt.compare(dto.password, guest.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    return this.signToken(guest.id, 'GUEST');
  }

  async signToken(userId: string, role: string) {
    const token = await this.jwt.signAsync({ sub: userId, role });
    return { accessToken: token };
  }
}
