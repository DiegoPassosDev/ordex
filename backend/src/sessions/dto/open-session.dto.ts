import { IsUUID, IsOptional, IsString } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  tableId!: string;

  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  guestId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsUUID()
  waiterId?: string;
}
