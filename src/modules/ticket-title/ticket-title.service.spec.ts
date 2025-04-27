import { Test, TestingModule } from '@nestjs/testing';
import { TicketTitleService } from './ticket-title.service';

describe('TicketTitleService', () => {
  let service: TicketTitleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketTitleService],
    }).compile();

    service = module.get<TicketTitleService>(TicketTitleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
