import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockUnit } from '@prisma/client';

export class CreateStockItemDto {
  @IsString()
  restaurantId!: string;

  @IsString()
  name!: string;

  @IsEnum(StockUnit)
  unit!: StockUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  category?: string;
}
