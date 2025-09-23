import { Test, TestingModule } from '@nestjs/testing';
import { LaborHoursController } from './labor-hours.controller';
import { LaborHoursService } from './labor-hours.service';

describe('LaborHoursController', () => {
  let controller: LaborHoursController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LaborHoursController],
      providers: [LaborHoursService],
    }).compile();

    controller = module.get<LaborHoursController>(LaborHoursController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
