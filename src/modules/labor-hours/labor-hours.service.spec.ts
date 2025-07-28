import { Test, TestingModule } from '@nestjs/testing';
import { LaborHoursService } from './labor-hours.service';

describe('LaborHoursService', () => {
  let service: LaborHoursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaborHoursService],
    }).compile();

    service = module.get<LaborHoursService>(LaborHoursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
