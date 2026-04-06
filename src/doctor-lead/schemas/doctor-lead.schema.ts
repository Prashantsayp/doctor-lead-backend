import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum LeadProfession {
  DOCTOR = 'DOCTOR',
  CA = 'CA',
  LAWYER = 'LAWYER',
  SALARIED = 'SALARIED',
  BUSINESSMAN = 'BUSINESSMAN',
  COMPANY_SECRETARY = 'COMPANY_SECRETARY',
  COST_ACCOUNTANT = 'COST_ACCOUNTANT',
  REALTOR = 'REALTOR',
  BROKER = 'BROKER',
  CHANNEL_PARTNER = 'CHANNEL_PARTNER',
}

export enum LeadStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
}

export enum RegVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export type DoctorLeadDocument = DoctorLead & Document

@Schema({ timestamps: true })
export class DoctorLead {
  @Prop({
    required: true,
    type: String,
    enum: LeadProfession,
    uppercase: true,
    trim: true,
    index: true,
  })
  profession!: LeadProfession

  @Prop({ required: true, trim: true })
 fullName!: string

  @Prop({ required: true, trim: true, index: true })
  mobileNumber!: string

  @Prop({ lowercase: true, trim: true, default: undefined })
  email?: string

  @Prop({ trim: true, uppercase: true, default: undefined })
  registrationNumber?: string

  @Prop({ trim: true, uppercase: true, default: undefined })
  panNumber?: string

  @Prop({ trim: true, default: undefined })
  aadharNumber?: string

  @Prop({ type: Boolean, default: false })
  isVerified?: boolean

  @Prop({ type: String, enum: LeadStatus, default: LeadStatus.NEW, index: true })
  status!: LeadStatus

  @Prop({ type: String, enum: RegVerificationStatus, default: RegVerificationStatus.PENDING })
  regVerificationStatus!: RegVerificationStatus

  @Prop({ required: true, trim: true })
  cityOrPinCode!: string

  @Prop({ type: Number, min: 0 })
  yearsOfPractice?: number

  @Prop({ type: [String], default: [] })
  qualification?: string[]

  @Prop({ type: [String], default: [] })
  practiceType?: string[]

  @Prop({ type: String, default: '', trim: true })
  remarks?: string

  @Prop({ type: Number, min: 0, default: 0 })
  monthlyGrossIncome?: number

  @Prop({ type: Number, min: 0, default: 0 })
  monthlyNetIncome?: number

  @Prop({ type: Number, min: 0, default: 0 })
  otherIncomeSources?: number

  @Prop({ type: Number, min: 0, default: 0 })
  monthlyEmi?: number

  @Prop({ type: Number, min: 0, default: 0 })
  activeLoans?: number

  @Prop({ type: [String], default: [] })
  loanType?: string[]

  @Prop({ type: Boolean, default: false })
  hasOverdue?: boolean

  @Prop({ type: Boolean, default: false })
  hasProperty?: boolean

  @Prop({ type: Number, min: 0, default: 0 })
  propertyValue?: number

  @Prop({ type: Number, min: 0, default: 0 })
  medicalEquipmentValue?: number

  @Prop({ type: Number, min: 0, max: 900, default: null })
  cibilScore?: number | null

  // ================= CKYC =================
  @Prop({
    type: {
      pan: {
        number: String,
        fileUrl: String,
        status: { type: String, default: 'PENDING' },
        verifiedAt: Date,
        remarks: String,
      },
      aadhar: {
        number: String,
        fileUrl: String,
        status: { type: String, default: 'PENDING' },
        verifiedAt: Date,
        remarks: String,
      },
      passport: {
        number: String,
        fileUrl: String,
        status: { type: String, default: 'PENDING' },
        verifiedAt: Date,
        remarks: String,
      },
      photo: {
        fileUrl: String,
        status: { type: String, default: 'PENDING' },
      },
      livePhoto: {
        fileUrl: String,
        status: { type: String, default: 'PENDING' },
      },
    },
    default: {},
  })
  kyc!: {
    pan?: any
    aadhar?: any
    passport?: any
    photo?: any
    livePhoto?: any
  }

  @Prop({ default: 'CKYC_PENDING', index: true })
  ckycStatus!: string
}

export const DoctorLeadSchema = SchemaFactory.createForClass(DoctorLead)