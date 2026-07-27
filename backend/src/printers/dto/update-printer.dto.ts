import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdatePrinterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
