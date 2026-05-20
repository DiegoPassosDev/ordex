import { IsInt, IsString, Min } from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number!: number;

  @IsString()
  restaurantId!: string;
}
