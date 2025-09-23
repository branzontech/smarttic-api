import {
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateAssignedTicketDetailFileDto {
  @IsUUID()
  @IsNotEmpty()
  ticketDetailId: string;
  
  @IsString()
  @IsNotEmpty()
  fileId: string;
}
