import { Test, TestingModule } from '@nestjs/testing';
import { TicketStateService } from './ticket-state.service';

describe('TicketStateService', () => {
  let service: TicketStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketStateService],
    }).compile();

    service = module.get<TicketStateService>(TicketStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
