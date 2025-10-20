import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { IsArray, ValidateNested, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class AssignedUserUpdateDto {
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  userId: string;

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}

export class UpdateTicketDto extends PartialType(
  OmitType(CreateTicketDto, ['assignedUsers'] as const),
) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignedUserUpdateDto)
  @IsOptional()
  assignedUsers?: AssignedUserUpdateDto[];
}
