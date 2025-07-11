import { Test, TestingModule } from '@nestjs/testing';
import { GeneralParametersController } from './general-parameters.controller';
import { GeneralParametersService } from './general-parameters.service';

describe('GeneralParametersController', () => {
  let controller: GeneralParametersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralParametersController],
      providers: [GeneralParametersService],
    }).compile();

    controller = module.get<GeneralParametersController>(GeneralParametersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
