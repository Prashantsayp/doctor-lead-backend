import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type DoctorLeadDocument = DoctorLead & Document

@Schema({ timestamps: true })
export class DoctorLead {
  @Prop({ required: true, trim: true })
  fullName: string

  @Prop({ required: true, trim: true })
  mobileNumber: string

  @Prop({ lowercase: true, trim: true })
  email?: string

  @Prop({ trim: true, unique: true, sparse: true })
  registrationNumber?: string

  @Prop({ required: true, trim: true })
  cityOrPinCode: string

  @Prop({ type: Number, min: 0 })
  yearsOfPractice?: number

  @Prop({ type: [String], default: [] })
  qualification?: string[]

  @Prop({ type: [String], default: [] })
  practiceType?: string[]

  @Prop({ type: String, default: '', trim: true })
  remarks?: string

  @Prop({ type: Boolean, default: false })
  consent?: boolean

  // ✅ Income
  @Prop({ type: Number, min: 0, default: 0 })
  monthlyGrossIncome?: number

  @Prop({ type: Number, min: 0, default: 0 })
  monthlyNetIncome?: number

  @Prop({ type: Number, min: 0, default: 0 })
  otherIncomeSources?: number

  // ✅ Obligations
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
}

export const DoctorLeadSchema = SchemaFactory.createForClass(DoctorLead)
