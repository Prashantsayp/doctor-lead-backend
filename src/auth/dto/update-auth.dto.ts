import { IsEnum, IsOptional, IsString } from 'class-validator'
import { UserRole, UserStatus } from '../../user/schemas/user.schema'

export class UpdateAuthDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  designation?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus
}
