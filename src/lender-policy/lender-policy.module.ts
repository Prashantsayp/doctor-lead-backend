import { Module } from '@nestjs/common';
import { MongooseModule }
from '@nestjs/mongoose';
import { LenderPolicyService }
from './lender-policy.service';
import { LenderPolicyController }
from './lender-policy.controller';

import {
  LenderPolicy,
  LenderPolicySchema,
} from './schema/lender-policy-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LenderPolicy.name,
        schema: LenderPolicySchema,
      },
    ]),

  ],
  controllers: [
    LenderPolicyController,
  ],
  providers: [
    LenderPolicyService,
  ],

  exports: [
    LenderPolicyService,
  ],
})

export class LenderPolicyModule {}