import { Test, TestingModule } from '@nestjs/testing';
import { NoteAgentTicketsController } from './note-agent-tickets.controller';
import { NoteAgentTicketsService } from './note-agent-tickets.service';

describe('NoteAgentTicketsController', () => {
  let controller: NoteAgentTicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteAgentTicketsController],
      providers: [NoteAgentTicketsService],
    }).compile();

    controller = module.get<NoteAgentTicketsController>(NoteAgentTicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
