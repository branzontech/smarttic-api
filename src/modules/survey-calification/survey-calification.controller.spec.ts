import { Test, TestingModule } from '@nestjs/testing';
import { SurveyCalificationController } from './survey-calification.controller';
import { SurveyCalificationService } from './survey-calification.service';

describe('SurveyCalificationController', () => {
  let controller: SurveyCalificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveyCalificationController],
      providers: [SurveyCalificationService],
    }).compile();

    controller = module.get<SurveyCalificationController>(SurveyCalificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
