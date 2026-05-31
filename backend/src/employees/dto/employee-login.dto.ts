import { IsEmail, IsString } from 'class-validator';

export class EmployeeLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
