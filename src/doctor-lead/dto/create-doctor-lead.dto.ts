import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  Min,
  Max,
} from 'class-validator'

export class CreateDoctorLeadDto {
  // ✅ REQUIRED
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string

  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^[6-9]\d{9}$/, { message: 'Mobile number must be 10 digit Indian number' })
  mobileNumber: string

  // ✅ REQUIRED
  @IsNotEmpty({ message: 'City/Pin is required' })
  @IsString()
  cityOrPinCode: string

  // ✅ OPTIONAL
  @IsOptional()
  @Matches(/^[A-Z0-9/-]+$/, { message: 'Invalid registration number' })
  registrationNumber?: string

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfPractice?: number

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
  remarks?: string

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
