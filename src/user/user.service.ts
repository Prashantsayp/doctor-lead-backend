import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as bcrypt from 'bcryptjs'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User, UserDocument, UserRole, UserStatus } from './schemas/user.schema'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ================= CREATE USER =================
  async create(createDto: CreateUserDto) {
    const email = String(createDto.email || '').toLowerCase().trim()

    const existing = await this.userModel.findOne({ email }).lean()
    if (existing) throw new BadRequestException('Email already exists')

    const hashed = await bcrypt.hash(String(createDto.password || '').trim(), 10)

    try {
      const user = await this.userModel.create({
        name: String(createDto.name || '').trim(),
        email,
        password: hashed,
        designation: String(createDto.designation || '').trim(),
        role: createDto.role || UserRole.USER,
        status: UserStatus.ACTIVE,
      })

      const obj = user.toObject()
      const { password, ...safe } = obj
      return safe
    } catch (err: any) {
      // ✅ DB duplicate protection
      if (err?.code === 11000) {
        throw new BadRequestException('Email already exists')
      }
      throw err
    }
  }

  async findAll() {
    return this.userModel.find().select('-password').sort({ createdAt: -1 }).lean()
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password').lean()
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const exists = await this.userModel.findById(id).lean()
    if (!exists) throw new NotFoundException('User not found')

    const updateData: any = {}

    if (updateDto.name !== undefined) updateData.name = updateDto.name.trim()
    if (updateDto.designation !== undefined)
      updateData.designation = updateDto.designation.trim()
    if (updateDto.role !== undefined) updateData.role = updateDto.role
    if (updateDto.status !== undefined) updateData.status = updateDto.status

    if (updateDto.email !== undefined) {
      const email = updateDto.email.toLowerCase().trim()

      const emailTaken = await this.userModel
        .findOne({ email, _id: { $ne: id } })
        .lean()

      if (emailTaken) throw new BadRequestException('Email already exists')

      updateData.email = email
    }

    if (updateDto.password !== undefined && updateDto.password.length > 0) {
      updateData.password = await bcrypt.hash(updateDto.password.trim(), 10)
    }

    try {
      const updated = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select('-password')
        .lean()

      return updated
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new BadRequestException('Email already exists')
      }
      throw err
    }
  }

  async delete(id: string) {
    const deleted = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .lean()
    if (!deleted) throw new NotFoundException('User not found')
    return { message: 'User deleted successfully', deletedUser: deleted }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).lean()
  }

  async findByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
  }
}
