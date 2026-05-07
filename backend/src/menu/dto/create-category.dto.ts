import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsEnum(CategoryType)
  type!: CategoryType;

  @IsString()
  restaurantId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}