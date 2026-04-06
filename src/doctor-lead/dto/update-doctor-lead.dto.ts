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
  IsEnum,
} from 'class-validator'
import { LeadStatus } from '../schemas/doctor-lead.schema'

export class UpdateDoctorLeadDto {
  @IsOptional()
  @IsString()
  fullName?: string

  @IsOptional()
  @Matches(/^(\+?91[\s-]?)?[6-9]\d{9}$/, {
    message: 'Mobile number must be valid Indian number',
  })
  mobileNumber?: string

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string | null

  @IsOptional()
  @IsString()
  cityOrPinCode?: string

  @IsOptional()
  @Matches(/^[A-Z0-9/-]+$/i, {
    message: 'Invalid registration number',
  })
  registrationNumber?: string | null

  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, {
    message: 'Invalid PAN format',
  })
  panNumber?: string | null

  @IsOptional()
  @Matches(/^\s*\d{4}\s*\d{4}\s*\d{4}\s*$/, {
    message: 'Invalid Aadhar number',
  })
  aadharNumber?: string | null

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
  remarks?: string | null

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

  @IsOptional()
  @IsString()
  passportNumber?: string

  @IsOptional()
  @IsString()
  panFileUrl?: string

  @IsOptional()
  @IsString()
  aadhaarFileUrl?: string

  @IsOptional()
  @IsString()
  passportFileUrl?: string

  @IsOptional()
  @IsString()
  photoFileUrl?: string

  @IsOptional()
  @IsString()
  livePhotoFileUrl?: string

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus
}