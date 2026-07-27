import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryType } from '@prisma/client';

class PrinterRuleDto {
  @IsEnum(CategoryType)
  categoryType!: CategoryType;
}

export class CreatePrinterDto {
  @IsString()
  name!: string;

  @IsString()
  ip!: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsString()
  location!: string;

  @IsString()
  restaurantId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrinterRuleDto)
  rules?: PrinterRuleDto[];
}
