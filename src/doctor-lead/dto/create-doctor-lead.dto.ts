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
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string

  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^(\+?91[\s-]?)?[6-9]\d{9}$/, { message: 'Mobile number must be valid Indian number' })
  mobileNumber: string

  @IsNotEmpty({ message: 'City/Pin is required' })
  @IsString()
  cityOrPinCode: string

  @IsOptional()
  @Matches(/^[A-Z0-9/-]+$/i, { message: 'Invalid registration number' })
  registrationNumber?: string

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, { message: 'Invalid PAN format' })
  panNumber?: string

  @IsOptional()
  @IsString()
  @Matches(/^\s*\d{4}\s*\d{4}\s*\d{4}\s*$/, { message: 'Invalid Aadhar number' })
  aadharNumber?: string

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(900)
  cibilScore?: number | null
}