import { IsUUID } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  tableId!: string;

  @IsUUID()
  restaurantId!: string;
}