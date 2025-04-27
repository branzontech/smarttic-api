import { IsString, IsBoolean, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiPropertyOptional({
    description: 'Descripción del ticket',
    type: String,
    example: 'El sistema no permite el inicio de sesión',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID del usuario que crea el ticket',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID('4', { message: 'userId debe ser un UUID válido.' })
  userId: string;

  @ApiProperty({
    description: 'ID del título del ticket',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'ticketTitleId debe ser un UUID válido.' })
  ticketTitleId: string;

  @ApiProperty({
    description: 'ID del estado del ticket',
    type: String,
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: true,
  })
  @IsUUID('4', { message: 'ticketStateId debe ser un UUID válido.' })
  ticketStateId: string;

  @ApiPropertyOptional({
    description: 'Estado del ticket',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
