import { IsString, IsBoolean, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketTitleDto {
  @ApiProperty({
    description: 'ID de la categoría asociada al título del ticket',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID('4', { message: 'ticketCategoryId debe ser un UUID válido.' })
  ticketCategoryId: string;

  @ApiProperty({
    description: 'ID de la prioridad asociada al título del ticket',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'ticketPriorityId debe ser un UUID válido.' })
  ticketPriorityId: string;

  @ApiProperty({
    description: 'Descripción del título del ticket',
    type: String,
    example: 'Problema de acceso a la plataforma',
    required: true,
  })
  @IsString({ message: 'description debe ser un string.' })
  description: string;

  @ApiPropertyOptional({
    description: 'Estado del título del ticket',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
