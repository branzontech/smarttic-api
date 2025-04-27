import { Test, TestingModule } from '@nestjs/testing';
import { TicketStateController } from './ticket-state.controller';
import { TicketStateService } from './ticket-state.service';

describe('TicketStateController', () => {
  let controller: TicketStateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketStateController],
      providers: [TicketStateService],
    }).compile();

    controller = module.get<TicketStateController>(TicketStateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
