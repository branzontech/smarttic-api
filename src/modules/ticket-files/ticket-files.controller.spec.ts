import { Test, TestingModule } from '@nestjs/testing';
import { TicketFilesController } from './ticket-files.controller';
import { TicketFilesService } from './ticket-files.service';

describe('TicketFilesController', () => {
  let controller: TicketFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketFilesController],
      providers: [TicketFilesService],
    }).compile();

    controller = module.get<TicketFilesController>(TicketFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
