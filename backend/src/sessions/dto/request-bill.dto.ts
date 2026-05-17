import { IsEnum, IsBoolean } from 'class-validator';
 
// Usa os mesmos valores do enum PaymentMethod do schema
export enum PreferredPaymentMethod {
  CASH   = 'CASH',
  PIX    = 'PIX',
  DEBIT  = 'DEBIT',
  CREDIT = 'CREDIT',
}
 
export class RequestBillDto {
  @IsEnum(PreferredPaymentMethod)
  preferredPaymentMethod!: PreferredPaymentMethod;
 
  @IsBoolean()
  serviceChargeAccepted!: boolean;
}