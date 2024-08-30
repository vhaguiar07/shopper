import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmController } from './confirm.controller';

describe('ConfirmController', () => {
  let controller: ConfirmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfirmController],
    }).compile();

    controller = module.get<ConfirmController>(ConfirmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
