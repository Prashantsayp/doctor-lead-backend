import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorLeadController } from './doctor-lead.controller';
import { DoctorLeadService } from './doctor-lead.service';
import { DoctorLead, DoctorLeadSchema } from './schemas/doctor-lead.schema';
import { OmsService } from 'src/oms/oms.service';
import { PolicyUploadModule } from '../policy-upload/policy-upload.module';
import { LenderPolicy, LenderPolicySchema } from '../lender-policy/schema/lender-policy-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DoctorLead.name,
        schema: DoctorLeadSchema,
      },

      {
        name: LenderPolicy.name,  
        schema: LenderPolicySchema,
      },
    ]),

    PolicyUploadModule,
  ],
  controllers: [DoctorLeadController],
  providers: [DoctorLeadService, OmsService],
  exports: [DoctorLeadService],
})
export class DoctorLeadModule {}