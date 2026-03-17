import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum LeadProfession {
  DOCTOR = 'DOCTOR',
  CA = 'CA',
  LAWYER = 'LAWYER',
  ENGINEER = 'ENGINEER',
}

export type DoctorLeadDocument = DoctorLead & Document

@Schema({ timestamps: true })
export class DoctorLead {
  @Prop({
    required: true,
    enum: LeadProfession,
    uppercase: true,
    trim: true,
    index: true,
  })
  profession: LeadProfession

  @Prop({ required: true, trim: true })
  fullName: string

  @Prop({ required: true, trim: true })
  mobileNumber: string

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
}

export const DoctorLeadSchema = SchemaFactory.createForClass(DoctorLead)

DoctorLeadSchema.index(
  { profession: 1, mobileNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      profession: { $type: 'string', $ne: '' },
      mobileNumber: { $type: 'string', $ne: '' },
    },
  },
)

DoctorLeadSchema.index(
  { profession: 1, registrationNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      profession: { $type: 'string', $ne: '' },
      registrationNumber: { $type: 'string', $ne: '' },
    },
  },
)

DoctorLeadSchema.index(
  { profession: 1, panNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      profession: { $type: 'string', $ne: '' },
      panNumber: { $type: 'string', $ne: '' },
    },
  },
)

DoctorLeadSchema.index(
  { profession: 1, aadharNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      profession: { $type: 'string', $ne: '' },
      aadharNumber: { $type: 'string', $ne: '' },
    },
  },
)

DoctorLeadSchema.index(
  { profession: 1, email: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      profession: { $type: 'string', $ne: '' },
      email: { $type: 'string', $ne: '' },
    },
  },
)

DoctorLeadSchema.index({ profession: 1, createdAt: -1 })
DoctorLeadSchema.index({ createdAt: -1 })

DoctorLeadSchema.pre('save', function () {
  const doc = this as any

  if (doc.profession) {
    doc.profession = String(doc.profession).trim().toUpperCase()
  }

  if (doc.registrationNumber !== undefined && doc.registrationNumber !== null) {
    const cleanedReg = String(doc.registrationNumber).trim().toUpperCase()
    doc.registrationNumber = cleanedReg || undefined
  }

  if (doc.panNumber !== undefined && doc.panNumber !== null) {
    const cleanedPan = String(doc.panNumber).trim().toUpperCase()
    doc.panNumber = cleanedPan || undefined
  }

  if (doc.email !== undefined && doc.email !== null) {
    const cleanedEmail = String(doc.email).trim().toLowerCase()
    doc.email = cleanedEmail || undefined
  }

  if (doc.aadharNumber !== undefined && doc.aadharNumber !== null) {
    const cleanedAadhar = String(doc.aadharNumber).replace(/\D/g, '')
    doc.aadharNumber = cleanedAadhar || undefined
  }

  if (doc.mobileNumber !== undefined && doc.mobileNumber !== null) {
    doc.mobileNumber = String(doc.mobileNumber).replace(/\D/g, '')
  }

  const reg = doc.registrationNumber
  doc.isVerified = Boolean(reg && String(reg).trim().length > 0)
})

function syncVerifiedInUpdate(this: any) {
  const update: any = this.getUpdate() || {}

  const $set = { ...(update.$set || {}) }
  const $unset = { ...(update.$unset || {}) }

  if (update.profession !== undefined) {
    $set.profession = String(update.profession).trim().toUpperCase()
    delete update.profession
  }

  if ($set.profession !== undefined) {
    $set.profession = String($set.profession).trim().toUpperCase()
  }

  if (update.mobileNumber !== undefined) {
    $set.mobileNumber = String(update.mobileNumber).replace(/\D/g, '')
    delete update.mobileNumber
  }

  if ($set.mobileNumber !== undefined) {
    $set.mobileNumber = String($set.mobileNumber).replace(/\D/g, '')
  }

  if (update.email !== undefined) {
    const cleanedEmail = String(update.email ?? '').trim().toLowerCase()
    if (cleanedEmail) $set.email = cleanedEmail
    else $unset.email = 1
    delete update.email
  }

  if ($set.email !== undefined) {
    const cleanedEmail = String($set.email ?? '').trim().toLowerCase()
    if (cleanedEmail) $set.email = cleanedEmail
    else {
      delete $set.email
      $unset.email = 1
    }
  }

  if (update.panNumber !== undefined) {
    const cleanedPan = String(update.panNumber ?? '').trim().toUpperCase()
    if (cleanedPan) $set.panNumber = cleanedPan
    else $unset.panNumber = 1
    delete update.panNumber
  }

  if ($set.panNumber !== undefined) {
    const cleanedPan = String($set.panNumber ?? '').trim().toUpperCase()
    if (cleanedPan) $set.panNumber = cleanedPan
    else {
      delete $set.panNumber
      $unset.panNumber = 1
    }
  }

  if (update.aadharNumber !== undefined) {
    const cleanedAadhar = String(update.aadharNumber ?? '').replace(/\D/g, '')
    if (cleanedAadhar) $set.aadharNumber = cleanedAadhar
    else $unset.aadharNumber = 1
    delete update.aadharNumber
  }

  if ($set.aadharNumber !== undefined) {
    const cleanedAadhar = String($set.aadharNumber ?? '').replace(/\D/g, '')
    if (cleanedAadhar) $set.aadharNumber = cleanedAadhar
    else {
      delete $set.aadharNumber
      $unset.aadharNumber = 1
    }
  }

  const regFromDirect = update.registrationNumber
  const regFromSet = $set.registrationNumber
  const regProvided = regFromSet !== undefined ? regFromSet : regFromDirect

  const regIsExplicitUnset = $unset.registrationNumber !== undefined
  const regIsCleared =
    regProvided !== undefined &&
    (regProvided === null ||
      regProvided === '' ||
      (typeof regProvided === 'string' && regProvided.trim() === ''))

  if (regIsExplicitUnset || regIsCleared) {
    $unset.registrationNumber = 1
    $set.isVerified = false

    delete update.registrationNumber
    delete $set.registrationNumber

    update.$set = $set
    update.$unset = $unset
    this.setUpdate(update)
    return
  }

  if (regProvided !== undefined) {
    const cleaned = String(regProvided ?? '').trim().toUpperCase()

    if (!cleaned) {
      $unset.registrationNumber = 1
      $set.isVerified = false

      delete update.registrationNumber
      delete $set.registrationNumber

      update.$set = $set
      update.$unset = $unset
      this.setUpdate(update)
      return
    }

    $set.registrationNumber = cleaned
    $set.isVerified = true

    delete update.registrationNumber

    update.$set = $set
    update.$unset = $unset
    this.setUpdate(update)
    return
  }

  update.$set = $set
  update.$unset = $unset
  this.setUpdate(update)
}

DoctorLeadSchema.pre('findOneAndUpdate', syncVerifiedInUpdate)
DoctorLeadSchema.pre('updateOne', syncVerifiedInUpdate)
DoctorLeadSchema.pre('updateMany', syncVerifiedInUpdate)