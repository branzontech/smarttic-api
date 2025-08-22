import { Test, TestingModule } from '@nestjs/testing';
import { AssignedTicketFileService } from './assigned-ticket-file.service';

describe('AssignedTicketFileService', () => {
  let service: AssignedTicketFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignedTicketFileService],
    }).compile();

    service = module.get<AssignedTicketFileService>(AssignedTicketFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
