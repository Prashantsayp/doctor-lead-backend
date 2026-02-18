import {
  Controller,
  Get,
  Param,
  Delete,
  Put,
  Body,
  Post,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import mongoose from 'mongoose'

import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'


@UseGuards(JwtAuthGuard) 

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ================= CREATE USER =================
  @Post('create-users')
  create(@Body() createDto: CreateUserDto) {
    return this.userService.create(createDto)
  }

  // ================= GET ALL USERS =================
  @Get('get-users')
  findAll() {
    return this.userService.findAll()
  }

  // ================= GET SINGLE USER =================
  @Get('get-users/:id')
  findOne(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.findById(id)
  }

  // ================= UPDATE USER =================
  @Put('update-users/:id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.update(id, updateDto)
  }

  // ================= DELETE USER =================
  @Delete('delete-users/:id')
  delete(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.delete(id)
  }
}
