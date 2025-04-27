import { PartialType } from '@nestjs/swagger';
import { CreateTicketDetailDto } from './create-ticket-detail.dto';

export class UpdateTicketDetailDto extends PartialType(CreateTicketDetailDto) {}
