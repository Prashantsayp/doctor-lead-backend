import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DoctorLeadService } from './doctor-lead.service'
import { DoctorLeadController } from './doctor-lead.controller'
import {
  DoctorLead,
  DoctorLeadSchema,
} from './schemas/doctor-lead.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorLead.name, schema: DoctorLeadSchema },
    ]),
  ],
  controllers: [DoctorLeadController],
  providers: [DoctorLeadService],
})
export class DoctorLeadModule {}
