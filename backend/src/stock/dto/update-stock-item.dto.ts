import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockUnit } from '@prisma/client';

export class UpdateStockItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(StockUnit)
  unit?: StockUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

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

  @IsOptional()
  active?: boolean;
}
