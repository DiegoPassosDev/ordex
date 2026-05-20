import { IsUUID } from 'class-validator';

export class RequestTableAccessDto {
  @IsUUID()
  guestId!: string;
}
