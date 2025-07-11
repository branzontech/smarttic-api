import { Test, TestingModule } from '@nestjs/testing';
import { FormResponsesController } from './form-responses.controller';
import { FormResponsesService } from './form-responses.service';

describe('FormResponsesController', () => {
  let controller: FormResponsesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormResponsesController],
      providers: [FormResponsesService],
    }).compile();

    controller = module.get<FormResponsesController>(FormResponsesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
