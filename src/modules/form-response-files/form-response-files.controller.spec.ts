import { Test, TestingModule } from '@nestjs/testing';
import { FormResponseFilesController } from './form-response-files.controller';
import { FormResponseFilesService } from './form-response-files.service';

describe('FormResponseFilesController', () => {
  let controller: FormResponseFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormResponseFilesController],
      providers: [FormResponseFilesService],
    }).compile();

    controller = module.get<FormResponseFilesController>(FormResponseFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
