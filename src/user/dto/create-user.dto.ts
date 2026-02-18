import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator'
import { UserRole } from '../schemas/user.schema'

export class CreateUserDto {
  @IsNotEmpty()
  name: string

  @IsEmail()
  email: string

  @MinLength(6)
  password: string

  @IsNotEmpty()
  designation: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole
}
