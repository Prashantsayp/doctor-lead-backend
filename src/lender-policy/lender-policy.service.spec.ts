import { Test, TestingModule } from '@nestjs/testing';
import { LenderPolicyService } from './lender-policy.service';

describe('LenderPolicyService', () => {
  let service: LenderPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LenderPolicyService],
    }).compile();

    service = module.get<LenderPolicyService>(LenderPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
