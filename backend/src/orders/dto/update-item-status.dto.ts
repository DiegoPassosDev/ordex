import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateItemStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
