import { IsEnum } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class AddPrinterRuleDto {
  @IsEnum(CategoryType)
  categoryType!: CategoryType;
}
