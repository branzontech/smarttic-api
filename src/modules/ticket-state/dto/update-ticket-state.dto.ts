import { PartialType } from '@nestjs/swagger';
import { CreateTicketStateDto } from './create-ticket-state.dto';

export class UpdateTicketStateDto extends PartialType(CreateTicketStateDto) {}
