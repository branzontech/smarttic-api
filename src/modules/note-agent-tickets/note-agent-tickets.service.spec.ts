import { Test, TestingModule } from '@nestjs/testing';
import { NoteAgentTicketsService } from './note-agent-tickets.service';

describe('NoteAgentTicketsService', () => {
  let service: NoteAgentTicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoteAgentTicketsService],
    }).compile();

    service = module.get<NoteAgentTicketsService>(NoteAgentTicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
