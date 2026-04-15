import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DoctorLeadController } from './doctor-lead.controller'
import { DoctorLeadService } from './doctor-lead.service'
import { DoctorLead, DoctorLeadSchema, } from './schemas/doctor-lead.schema'
import { OmsService } from 'src/oms/oms.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorLead.name, schema: DoctorLeadSchema },
    ]),
  ],
  controllers: [DoctorLeadController],
  providers: [DoctorLeadService, OmsService],
  exports: [DoctorLeadService],
})
export class DoctorLeadModule {}