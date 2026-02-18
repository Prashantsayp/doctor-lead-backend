import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
} from 'class-validator'

export class UpdateDoctorLeadDto {
  @IsOptional()
  @IsString()
  fullName?: string

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  mobileNumber?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  cityOrPinCode?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfPractice?: number | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualification?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  practiceType?: string[]

  @IsOptional()
  @IsString()
  registrationNumber?: string

  @IsOptional()
  @IsString()
  remarks?: string | null

  // ✅ Income
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyGrossIncome?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyNetIncome?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherIncomeSources?: number

  // ✅ Obligations
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyEmi?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeLoans?: number

@IsOptional()
@IsArray()
@IsString({ each: true })
loanType?: string[]

  @IsOptional()
  @IsBoolean()
  hasOverdue?: boolean

  // ✅ Assets
  @IsOptional()
  @IsBoolean()
  hasProperty?: boolean

  @IsOptional()
  @IsNumber()
  @Min(0)
  propertyValue?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  medicalEquipmentValue?: number

  // ✅ Credit
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(900)
  cibilScore?: number | null

  @IsOptional()
  @IsBoolean()
  consent?: boolean
}
