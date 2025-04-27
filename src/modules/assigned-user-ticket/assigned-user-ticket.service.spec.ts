import { Test, TestingModule } from '@nestjs/testing';
import { AssignedUserTicketService } from './assigned-user-ticket.service';

describe('AssignedUserTicketService', () => {
  let service: AssignedUserTicketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignedUserTicketService],
    }).compile();

    service = module.get<AssignedUserTicketService>(AssignedUserTicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
