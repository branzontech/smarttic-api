import { Test, TestingModule } from '@nestjs/testing';
import { TicketTitleController } from './ticket-title.controller';
import { TicketTitleService } from './ticket-title.service';

describe('TicketTitleController', () => {
  let controller: TicketTitleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketTitleController],
      providers: [TicketTitleService],
    }).compile();

    controller = module.get<TicketTitleController>(TicketTitleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
