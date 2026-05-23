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
} from '@nestjs/common';

import { LenderService } from './lender.service';

import { CreateLenderDto } from './dto/create-lender-dto';
import { MatchLenderDto } from './dto/match-lender.dto';
import { UpdateLenderDto } from './dto/update-lender-dto';

@Controller('lender')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class LenderController {

  constructor(
    private readonly lenderService: LenderService,
  ) {}

  /**
   * Create lender
   */
  @Post('create')
  create(
    @Body() body: CreateLenderDto,
  ) {
    return this.lenderService.create(body);
  }

  /**
   * Get all lenders
   */
  @Get('get-all')
  getAll() {
    return this.lenderService.getAll();
  }

  /**
   * Match lenders
   */
  @Post('match')
  match(
    @Body() body: MatchLenderDto,
  ) {
    return this.lenderService.matchLenders(body);
  }

  /**
   * Get lender by id
   */
  @Get(':id')
  getById(
    @Param('id') id: string,
  ) {
    return this.lenderService.getById(id);
  }

  /**
   * Update lender
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateLenderDto,
  ) {
    return this.lenderService.update(id, body);
  }

  /**
   * Toggle lender status
   */
  @Patch('toggle-status/:id')
  toggleStatus(
    @Param('id') id: string,
  ) {
    return this.lenderService.toggleStatus(id);
  }

  /**
   * Delete lender
   */
  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.lenderService.remove(id);
  }
}