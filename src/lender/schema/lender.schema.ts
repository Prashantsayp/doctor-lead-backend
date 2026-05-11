import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LenderDocument = Lender & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Lender {
  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  })
  name: string;

  @Prop({
    required: true,
    min: 300,
    max: 900,
  })
  minCibil: number;

  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  maxFoir: number;

  @Prop({
    required: true,
    min: 0,
  })
  minIncome: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const LenderSchema = SchemaFactory.createForClass(Lender);
LenderSchema.index({ isActive: 1 });