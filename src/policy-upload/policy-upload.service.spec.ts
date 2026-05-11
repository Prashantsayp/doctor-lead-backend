import { Test, TestingModule } from '@nestjs/testing';
import { PolicyUploadService } from './policy-upload.service';

describe('PolicyUploadService', () => {
  let service: PolicyUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyUploadService],
    }).compile();

    service = module.get<PolicyUploadService>(PolicyUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
