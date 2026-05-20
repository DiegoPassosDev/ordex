import { IsUUID } from 'class-validator';

export class AssignWaiterDto {
  @IsUUID()
  waiterId!: string;
}
