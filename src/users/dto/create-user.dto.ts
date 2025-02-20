import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional() // Set to optional since some users might not need a specific role initially (like students)
  role: UserRole;

  @IsOptional()
  @MinLength(3)
  phone?: string; // Optional field for user phone number

  @IsOptional()
  @MinLength(5)
  address?: string; // Optional field for user address

  @IsOptional()
  @MinLength(2)
  instrument?: string; // Optional field for instructor's instrument (if role is instructor)
}
