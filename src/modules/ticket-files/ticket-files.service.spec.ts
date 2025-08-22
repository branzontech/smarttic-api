import { Test, TestingModule } from '@nestjs/testing';
import { TicketFilesService } from './ticket-files.service';

describe('TicketFilesService', () => {
  let service: TicketFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketFilesService],
    }).compile();

    service = module.get<TicketFilesService>(TicketFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
