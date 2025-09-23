import { PartialType } from '@nestjs/swagger';
import { createTicketFileDTO } from './create-ticket-file.dto';

export class UpdateTicketDetailDto extends PartialType(createTicketFileDTO) {}
