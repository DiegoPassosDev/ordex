import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockEntryDto {
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
