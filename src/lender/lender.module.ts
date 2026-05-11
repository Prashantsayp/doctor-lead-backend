import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lender, LenderSchema } from './schema/lender.schema';
import { LenderService } from './lender.service';
import { LenderController } from './lender.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Lender', schema: LenderSchema },
    ]),
  ],
  controllers: [LenderController],
  providers: [LenderService],
  exports: [MongooseModule],
})
export class LenderModule {}