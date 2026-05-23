import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';

import { Types } from 'mongoose';

import { LenderPolicyService }
from './lender-policy.service';

import { CreateLenderPolicyDto }
from './dto/create-lender-policy.dto';

import { UpdateLenderPolicyDto }
from './dto/update-lender-policy.dto';

@Controller('lender-policy')

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)

export class LenderPolicyController {

  constructor(
    private readonly service:
      LenderPolicyService,
  ) {}

  /**
   * Create Policy
   * lenderId auto generated from backend
   */
  @Post('create-policy')
  async create(

    @Body()
    dto: CreateLenderPolicyDto,

  ) {

    return await this.service.create(
      dto,
    );
  }

  /**
   * Get All Policies
   */
  @Get('all-policies')
  async findAll() {

    return await this.service.findAll();
  }

  /**
   * Get Single Policy
   */
  @Get(':id')
  async findOne(

    @Param('id')
    id: string,

  ) {

    this.validateObjectId(id);

    return await this.service.findOne(
      id,
    );
  }

  /**
   * Update Policy
   */
  @Patch(':id')
  async update(

    @Param('id')
    id: string,

    @Body()
    dto: UpdateLenderPolicyDto,

  ) {

    this.validateObjectId(id);

    return await this.service.update(
      id,
      dto,
    );
  }

  /**
   * Toggle Policy Status
   */
  @Patch('toggle-status/:id')
  async toggleStatus(

    @Param('id')
    id: string,

  ) {

    this.validateObjectId(id);

    return await this.service.toggleStatus(
      id,
    );
  }

  /**
   * Delete Policy
   */
  @Delete(':id')
  async remove(

    @Param('id')
    id: string,

  ) {

    this.validateObjectId(id);

    return await this.service.remove(
      id,
    );
  }

  /**
   * Validate Mongo ObjectId
   */
  private validateObjectId(
    id: string,
  ) {

    if (
      !Types.ObjectId.isValid(id)
    ) {

      throw new BadRequestException(
        'Invalid policy id',
      );
    }
  }
}