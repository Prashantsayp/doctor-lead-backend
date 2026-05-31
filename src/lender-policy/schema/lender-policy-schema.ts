import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

export type LenderPolicyDocument =
  LenderPolicy & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})

export class LenderPolicy {

  /**
   * Lender Id
   */
  @Prop({
    type: String,
    required: false,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  lenderId!: string;

  /**
   * Lender Name
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  lenderName!: string;

  /**
   * Policy Type
   */
  @Prop({
    type: String,
    default: '',
    trim: true,
    uppercase: true,
    index: true,
  })
  policyType?: string;

  /**
   * Minimum CIBIL
   */
  @Prop({
    type: Number,
    required: true,
    min: 300,
    max: 900,
    index: true,
  })
  minCibil!: number;

  /**
   * Maximum CIBIL
   */
  @Prop({
    type: Number,
    required: true,
    min: 300,
    max: 900,
  })
  maxCibil!: number;

  /**
   * Minimum Loan Amount
   */
  @Prop({
    type: Number,
    required: true,
    min: 1000,
  })
  minLoanAmount!: number;

  /**
   * Maximum Loan Amount
   */
  @Prop({
    type: Number,
    required: true,
    min: 1000,
  })
  maxLoanAmount!: number;

  /**
   * Minimum Income
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  minIncome!: number;

  /**
   * Maximum FOIR
   */
  @Prop({
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  })
  maxFOIR!: number;

  /**
   * ROI
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  })
  roi!: number;

  /**
   * Allowed Professions
   */
  @Prop({
    type: [String],
    default: [],
  })
  allowedProfessions!: string[];

  /**
   * Allowed Locations
   */
  @Prop({
    type: [String],
    default: [],
  })
  allowedLocations!: string[];

  /**
   * Blocked Locations
   */
  @Prop({
    type: [String],
    default: [],
  })
  blockedLocations!: string[];

  /**
   * Employment Types
   */
  @Prop({
    type: [String],
    default: [],
  })
  employmentTypes!: string[];

  /**
   * Remarks
   */
  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  remarks?: string;

  /**
   * Active Status
   */
  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive!: boolean;
}

export const LenderPolicySchema =
  SchemaFactory.createForClass(
    LenderPolicy,
  );

/**
 * Fast filtering indexes
 */
LenderPolicySchema.index({
  lenderId: 1,
  isActive: 1,
  minCibil: 1,
  maxFOIR: 1,
  roi: 1,
});

LenderPolicySchema.index({
  policyType: 1,
  lenderName: 1,
});