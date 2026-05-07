import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cancelWindowMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  acceptWindowMin?: number;
}