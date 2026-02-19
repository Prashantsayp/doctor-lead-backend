import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator'
import { UserRole, UserStatus } from '../schemas/user.schema'

export class UpdateUserDto {
  @IsOptional()
  name?: string

  @IsOptional()
  designation?: string
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus
}
