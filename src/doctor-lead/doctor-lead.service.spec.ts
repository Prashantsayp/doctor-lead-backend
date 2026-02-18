import { Test, TestingModule } from '@nestjs/testing';
import { DoctorLeadService } from './doctor-lead.service';

describe('DoctorLeadService', () => {
  let service: DoctorLeadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorLeadService],
    }).compile();

    service = module.get<DoctorLeadService>(DoctorLeadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
