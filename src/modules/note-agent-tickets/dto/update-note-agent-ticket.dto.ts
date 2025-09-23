import { PartialType } from '@nestjs/swagger';
import { CreateNoteAgentTicketDto } from './create-note-agent-ticket.dto';

export class UpdateNoteAgentTicketDto extends PartialType(CreateNoteAgentTicketDto) {}
