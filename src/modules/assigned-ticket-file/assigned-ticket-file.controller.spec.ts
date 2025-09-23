import { Test, TestingModule } from '@nestjs/testing';
import { AssignedTicketFileController } from './assigned-ticket-file.controller';
import { AssignedTicketFileService } from './assigned-ticket-file.service';

describe('AssignedTicketFileController', () => {
  let controller: AssignedTicketFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignedTicketFileController],
      providers: [AssignedTicketFileService],
    }).compile();

    controller = module.get<AssignedTicketFileController>(AssignedTicketFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
