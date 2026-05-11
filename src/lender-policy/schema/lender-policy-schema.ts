import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type LenderPolicyDocument = LenderPolicy & Document;

@Schema({ timestamps: true })
export class LenderPolicy {
  @Prop({
    type: Types.ObjectId,
    ref: 'Lender',
    required: true,
    index: true,
  })
  lenderId!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  lenderName?: string;

  @Prop({ type: Number, default: 0 })
  minCibil!: number;

  @Prop({ type: Number, default: 0 })
  minIncome!: number;

  @Prop({ type: Number, default: 0 })
  maxLoanAmount!: number;

  @Prop({ type: [String], default: [] })
  employmentTypes!: string[];

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;
}
export const LenderPolicySchema = SchemaFactory.createForClass(LenderPolicy);