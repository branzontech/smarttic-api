import { PartialType } from '@nestjs/swagger';
import { CreateTicketTitleDto } from './create-ticket-title.dto';

export class UpdateTicketTitleDto extends PartialType(CreateTicketTitleDto) {}
