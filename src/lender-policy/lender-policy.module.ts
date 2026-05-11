import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LenderPolicyService } from './lender-policy.service';
import { LenderPolicyController } from './lender-policy.controller';
import { LenderPolicySchema } from './schema/lender-policy-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Policy', schema: LenderPolicySchema },
    ]),
  ],
  controllers: [LenderPolicyController],
  providers: [LenderPolicyService],
  exports: [MongooseModule, LenderPolicyService],
})
export class LenderPolicyModule {}