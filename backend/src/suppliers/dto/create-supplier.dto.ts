import { IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  restaurantId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
