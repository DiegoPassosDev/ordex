import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockEntryItemDto {
  @IsString()
  stockItemId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  costPerUnit!: number;
}

export class CreateStockEntryDto {
  @IsString()
  stockItemId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsString()
  restaurantId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  costPerUnit!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class CreateStockEntryGroupDto {
  @IsString()
  restaurantId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockEntryItemDto)
  items!: CreateStockEntryItemDto[];
}
