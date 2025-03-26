import { Test, TestingModule } from '@nestjs/testing';
import { IdentificationTypeService } from './identification-type.service';

describe('IdentificationTypeService', () => {
  let service: IdentificationTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentificationTypeService],
    }).compile();

    service = module.get<IdentificationTypeService>(IdentificationTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
