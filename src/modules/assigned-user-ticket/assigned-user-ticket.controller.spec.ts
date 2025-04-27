import { Test, TestingModule } from '@nestjs/testing';
import { AssignedUserTicketController } from './assigned-user-ticket.controller';
import { AssignedUserTicketService } from './assigned-user-ticket.service';

describe('AssignedUserTicketController', () => {
  let controller: AssignedUserTicketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignedUserTicketController],
      providers: [AssignedUserTicketService],
    }).compile();

    controller = module.get<AssignedUserTicketController>(AssignedUserTicketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
