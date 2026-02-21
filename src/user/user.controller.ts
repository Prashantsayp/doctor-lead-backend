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
  Query,
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

  @Post('create-users')
  create(@Body() createDto: CreateUserDto) {
    return this.userService.create(createDto)
  }

  // ✅ GET USERS WITH PAGINATION + COUNT
  // /user/get-users?page=1&limit=10&q=aditya&role=ADMIN&status=ACTIVE
  @Get('get-users')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit || '10', 10) || 10, 1), 100) // max 100
    return this.userService.findAllPaginated({
      page: pageNum,
      limit: limitNum,
      q: q?.trim(),
      role: role?.trim(),
      status: status?.trim(),
    })
  }

  @Get('get-users/:id')
  findOne(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.findById(id)
  }

  @Put('update-users/:id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.update(id, updateDto)
  }

  @Delete('delete-users/:id')
  delete(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID')
    }
    return this.userService.delete(id)
  }
}