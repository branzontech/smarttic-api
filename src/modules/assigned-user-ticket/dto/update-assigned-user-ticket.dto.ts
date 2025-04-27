import { PartialType } from '@nestjs/swagger';
import { CreateAssignedUserTicketDto } from './create-assigned-user-ticket.dto';

export class UpdateAssignedUserTicketDto extends PartialType(CreateAssignedUserTicketDto) {}
