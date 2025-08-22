import { Test, TestingModule } from '@nestjs/testing';
import { AssignedTicketDetailFileService } from './assigned-ticket-detail-file.service';

describe('AssignedTicketDetailFileService', () => {
  let service: AssignedTicketDetailFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignedTicketDetailFileService],
    }).compile();

    service = module.get<AssignedTicketDetailFileService>(AssignedTicketDetailFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
