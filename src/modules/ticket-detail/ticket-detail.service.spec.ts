import { Test, TestingModule } from '@nestjs/testing';
import { TicketDetailService } from './ticket-detail.service';

describe('TicketDetailService', () => {
  let service: TicketDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketDetailService],
    }).compile();

    service = module.get<TicketDetailService>(TicketDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
