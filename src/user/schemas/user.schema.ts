import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  SALES = 'SALES',
  OPERATION ='OPERATION'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string

  @Prop({ required: true, select: false })
  password: string

  @Prop({ trim: true })
  designation: string;
  
@Prop({ type: String, enum: Object.values(UserRole), default: UserRole.USER })
role: UserRole


  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus
}

export const UserSchema = SchemaFactory.createForClass(User)
