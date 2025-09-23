import { PartialType } from '@nestjs/swagger';
import { CreateAssignedTicketDetailFileDto } from './create-assigned-ticket-detail-file.dto';

export class UpdateAssignedTicketDetailFileDto extends PartialType(CreateAssignedTicketDetailFileDto) {}
