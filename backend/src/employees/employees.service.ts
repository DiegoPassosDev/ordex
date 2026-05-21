import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeLoginDto } from './dto/employee-login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.employee.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: hash,
        pin: dto.pin,
        role: dto.role,
        restaurantId: dto.restaurantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        restaurantId: true,
        createdAt: true,
      },
    });
  }

  async findAllByRestaurant(restaurantId: string) {
    return this.prisma.employee.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        restaurantId: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        restaurantId: true,
        createdAt: true,
      },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('E-mail já cadastrado.');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        restaurantId: true,
      },
    });
  }

  async login(dto: EmployeeLoginDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (!employee || !employee.active)
      throw new UnauthorizedException(
        'Credenciais inválidas ou conta inativa.',
      );

    const valid = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    const token = await this.jwt.signAsync({
      sub: employee.id,
      role: employee.role,
      restaurantId: employee.restaurantId,
    });

    return {
      accessToken: token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        restaurantId: employee.restaurantId,
      },
    };
  }
}
