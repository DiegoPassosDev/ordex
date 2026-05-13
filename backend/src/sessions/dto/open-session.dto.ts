import { IsUUID, IsOptional } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  tableId!: string;

  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  guestId?: string;
}