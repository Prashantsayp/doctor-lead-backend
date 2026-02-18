import { Test, TestingModule } from '@nestjs/testing';
import { DoctorLeadController } from './doctor-lead.controller';
import { DoctorLeadService } from './doctor-lead.service';

describe('DoctorLeadController', () => {
  let controller: DoctorLeadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorLeadController],
      providers: [DoctorLeadService],
    }).compile();

    controller = module.get<DoctorLeadController>(DoctorLeadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
