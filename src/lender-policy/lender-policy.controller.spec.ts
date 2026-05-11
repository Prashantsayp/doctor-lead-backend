import { Test, TestingModule } from '@nestjs/testing';
import { LenderPolicyController } from './lender-policy.controller';

describe('LenderPolicyController', () => {
  let controller: LenderPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LenderPolicyController],
    }).compile();

    controller = module.get<LenderPolicyController>(LenderPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
