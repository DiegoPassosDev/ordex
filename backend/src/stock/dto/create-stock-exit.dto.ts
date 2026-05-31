import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockExitDto {
  @IsString()
  stockItemId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
