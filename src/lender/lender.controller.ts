import { Controller, Get, Post, Body } from '@nestjs/common';
import { LenderService } from './lender.service';
import { CreateLenderDto } from './dto/create-lender-dto';
import { MatchLenderDto } from './dto/match-lender.dto';

@Controller('lender')
export class LenderController {
  constructor(private readonly lenderService: LenderService) {}

  @Post('create')
  create(@Body() body: CreateLenderDto) {
    return this.lenderService.create(body);
  }

  @Get('get-all')
  getAll() {
    return this.lenderService.getAll();
  }

  @Post('match')
  match(@Body() body: MatchLenderDto) {
    return this.lenderService.matchLenders(body);
  }
}