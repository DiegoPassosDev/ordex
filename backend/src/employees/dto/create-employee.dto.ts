import { IsEnum, IsString, MinLength } from 'class-validator';
import { EmployeeRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(4)
  pin!: string;

  @IsEnum(EmployeeRole)
  role!: EmployeeRole;

  @IsString()
  restaurantId!: string;
}
