import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteAgentTicketDto {
  @ApiProperty({
    description: 'Descripción de la nota',
    type: String,
    example: 'El cliente reportó un problema con el pago',
    required: true,
  })
  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía.' })
  description: string;

  @ApiProperty({
    description: 'ID del ticket relacionado',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID('4', { message: 'El ID del ticket debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del ticket es requerido.' })
  ticketId: string;

  @ApiProperty({
    description: 'ID del agente/usuario que crea la nota',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID('4', { message: 'El ID del agente debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del agente es requerido.' })
  userId: string;
}
