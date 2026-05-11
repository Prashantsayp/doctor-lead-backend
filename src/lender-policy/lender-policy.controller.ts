import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { LenderPolicyService } from './lender-policy.service';
import { CreateLenderPolicyDto } from './dto/create-lender-policy.dto';
import { UpdateLenderPolicyDto } from './dto/update-lender-policy.dto';

@Controller('lender-policy')
export class LenderPolicyController {
  constructor(private readonly service: LenderPolicyService) {}

  @Post()
  async create(@Body() dto: CreateLenderPolicyDto) {
    return await this.service.create(dto);
  }

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLenderPolicyDto,
  ) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
}