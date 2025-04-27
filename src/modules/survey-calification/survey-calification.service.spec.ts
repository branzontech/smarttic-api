import { Test, TestingModule } from '@nestjs/testing';
import { SurveyCalificationService } from './survey-calification.service';

describe('SurveyCalificationService', () => {
  let service: SurveyCalificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SurveyCalificationService],
    }).compile();

    service = module.get<SurveyCalificationService>(SurveyCalificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
