import { Test, TestingModule } from '@nestjs/testing';
import { TicketDetailController } from './ticket-detail.controller';
import { TicketDetailService } from './ticket-detail.service';

describe('TicketDetailController', () => {
  let controller: TicketDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketDetailController],
      providers: [TicketDetailService],
    }).compile();

    controller = module.get<TicketDetailController>(TicketDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
