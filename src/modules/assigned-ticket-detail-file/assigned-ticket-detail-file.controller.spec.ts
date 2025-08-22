import { Test, TestingModule } from '@nestjs/testing';
import { AssignedTicketDetailFileController } from './assigned-ticket-detail-file.controller';
import { AssignedTicketDetailFileService } from './assigned-ticket-detail-file.service';

describe('AssignedTicketDetailFileController', () => {
  let controller: AssignedTicketDetailFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignedTicketDetailFileController],
      providers: [AssignedTicketDetailFileService],
    }).compile();

    controller = module.get<AssignedTicketDetailFileController>(AssignedTicketDetailFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
