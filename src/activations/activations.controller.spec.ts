import { Test, TestingModule } from '@nestjs/testing';
import { ActivationsController } from './activations.controller';

describe('ActivationsController', () => {
  let controller: ActivationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivationsController],
    }).compile();

    controller = module.get<ActivationsController>(ActivationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
