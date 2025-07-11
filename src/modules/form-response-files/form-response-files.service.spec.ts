import { Test, TestingModule } from '@nestjs/testing';
import { FormResponseFilesService } from './form-response-files.service';

describe('FormResponseFilesService', () => {
  let service: FormResponseFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormResponseFilesService],
    }).compile();

    service = module.get<FormResponseFilesService>(FormResponseFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
