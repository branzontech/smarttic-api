import { Test, TestingModule } from '@nestjs/testing';
import { GeneralParametersService } from './general-parameters.service';

describe('GeneralParametersService', () => {
  let service: GeneralParametersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralParametersService],
    }).compile();

    service = module.get<GeneralParametersService>(GeneralParametersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
