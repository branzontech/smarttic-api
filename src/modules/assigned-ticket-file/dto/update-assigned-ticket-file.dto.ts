import { PartialType } from '@nestjs/swagger';
import { CreateAssignedTicketFileDto } from './create-assigned-ticket-file.dto';

export class UpdateAssignedTicketFileDto extends PartialType(CreateAssignedTicketFileDto) {}
