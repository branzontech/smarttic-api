import { Test, TestingModule } from '@nestjs/testing';
import { SurveyResponseController } from './survey-response.controller';
import { SurveyResponseService } from './survey-response.service';

describe('SurveyResponseController', () => {
  let controller: SurveyResponseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveyResponseController],
      providers: [SurveyResponseService],
    }).compile();

    controller = module.get<SurveyResponseController>(SurveyResponseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
