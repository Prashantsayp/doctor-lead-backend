import { Test, TestingModule } from '@nestjs/testing';
import { PolicyUploadController } from './policy-upload.controller';

describe('PolicyUploadController', () => {
  let controller: PolicyUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyUploadController],
    }).compile();

    controller = module.get<PolicyUploadController>(PolicyUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
