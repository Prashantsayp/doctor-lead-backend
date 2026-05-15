import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { EligibilityService } from './eligibility.service';

@Controller('eligibility')
export class EligibilityController {

  constructor(
    private readonly eligibilityService: EligibilityService,
  ) {}

  @Post('check')
  async check(
    @Body() body: any,
  ) {

    return await this.eligibilityService.checkEligibility(
      body,
    );
  }
}