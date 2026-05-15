import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';

import {
  LenderPolicySchema,
} from '../lender-policy/schema/lender-policy-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Policy',
        schema: LenderPolicySchema,
      },
    ]),
  ],

  controllers: [
    EligibilityController,
  ],

  providers: [
    EligibilityService,
  ],
})
export class EligibilityModule {}