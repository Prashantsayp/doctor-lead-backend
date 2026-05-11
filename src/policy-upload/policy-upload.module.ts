import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PolicyUploadService } from './policy-upload.service';
import { PolicyUploadController } from './policy-upload.controller';

import { OcrModule } from '../ocr/ocr.module';
import { AiModule } from '../ai/ai.module';

import { Lender, LenderSchema } from '../lender/schema/lender.schema';
import { DoctorLead, DoctorLeadSchema } from '../doctor-lead/schemas/doctor-lead.schema';

@Module({
  imports: [
    OcrModule,
    AiModule,

    // ✅ THIS IS THE MAIN FIX
    MongooseModule.forFeature([
      { name: Lender.name, schema: LenderSchema },
      { name: DoctorLead.name, schema: DoctorLeadSchema },
    ]),
  ],
  controllers: [PolicyUploadController],
  providers: [PolicyUploadService],

  // ✅ needed for other modules
  exports: [PolicyUploadService],
})
export class PolicyUploadModule {}