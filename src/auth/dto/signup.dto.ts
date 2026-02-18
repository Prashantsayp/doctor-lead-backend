import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator'
import { UserRole } from '../../user/schemas/user.schema'

export class SignupDto {
  @IsNotEmpty()
  name: string

  @IsEmail()
  email: string

  @MinLength(6)
  password: string

  @IsNotEmpty()
  designation: string

  // optional (default USER)
  @IsEnum(UserRole)
  role?: UserRole
}
