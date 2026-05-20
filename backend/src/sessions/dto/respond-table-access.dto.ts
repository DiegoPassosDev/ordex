import { IsBoolean } from 'class-validator';

export class RespondTableAccessDto {
  @IsBoolean()
  approved!: boolean;
}
