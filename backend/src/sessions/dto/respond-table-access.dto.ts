import { IsBoolean, IsUUID } from 'class-validator';

export class RespondTableAccessDto {
  @IsUUID()
  ownerId!: string;

  @IsBoolean()
  approved!: boolean;
}