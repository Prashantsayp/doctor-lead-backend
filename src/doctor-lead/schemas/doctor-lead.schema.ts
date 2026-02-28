import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type DoctorLeadDocument = DoctorLead & Document

@Schema({ timestamps: true })
export class DoctorLead {
  @Prop({ required: true, trim: true })
  fullName: string

  @Prop({ required: true, trim: true })
  mobileNumber: string

  @Prop({ lowercase: true, trim: true, default: undefined })
  email?: string

  @Prop({ trim: true, default: undefined })
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
  { mobileNumber: 1 },
  { unique: true, partialFilterExpression: { mobileNumber: { $type: 'string', $ne: '' } } },
)

DoctorLeadSchema.index(
  { registrationNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { registrationNumber: { $type: 'string', $ne: '' } } },
)

DoctorLeadSchema.index(
  { panNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { panNumber: { $type: 'string', $ne: '' } } },
)

DoctorLeadSchema.index(
  { aadharNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { aadharNumber: { $type: 'string', $ne: '' } } },
)

DoctorLeadSchema.index(
  { email: 1 },
  { unique: true, sparse: true, partialFilterExpression: { email: { $type: 'string', $ne: '' } } },
)

DoctorLeadSchema.index({ createdAt: -1 })

DoctorLeadSchema.pre('save', function () {
  const reg = (this as any).registrationNumber
  ;(this as any).isVerified = Boolean(reg && String(reg).trim().length > 0)
})

function syncVerifiedInUpdate(this: any) {
  const update: any = this.getUpdate() || {}

  const $set = { ...(update.$set || {}) }
  const $unset = { ...(update.$unset || {}) }

  const regFromDirect = update.registrationNumber
  const regFromSet = $set.registrationNumber
  const regProvided = regFromSet !== undefined ? regFromSet : regFromDirect

  const regIsExplicitUnset = $unset.registrationNumber !== undefined
  const regIsCleared =
    regProvided !== undefined &&
    (regProvided === null || regProvided === '' || (typeof regProvided === 'string' && regProvided.trim() === ''))

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