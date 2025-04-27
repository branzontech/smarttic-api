import { Test, TestingModule } from '@nestjs/testing';
import { TicketPriorityController } from './ticket-priority.controller';
import { TicketPriorityService } from './ticket-priority.service';

describe('TicketPriorityController', () => {
  let controller: TicketPriorityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketPriorityController],
      providers: [TicketPriorityService],
    }).compile();

    controller = module.get<TicketPriorityController>(TicketPriorityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
