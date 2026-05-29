import { IsEnum, IsOptional, IsNumber, Min, IsString } from 'class-validator';

export enum PreferredPaymentMethod {
  CASH = 'CASH',
  PIX = 'PIX',
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export class RequestBillDto {
  @IsEnum(PreferredPaymentMethod)
  preferredPaymentMethod!: PreferredPaymentMethod;

  @IsString()
  serviceChargeType!: 'PERCENTAGE' | 'CUSTOM' | 'NONE';

  @IsOptional()
  @IsNumber()
  customServiceChargeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  splitCount?: number;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
