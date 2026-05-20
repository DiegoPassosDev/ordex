import { IsString } from 'class-validator';

export class EmployeeLoginDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}
