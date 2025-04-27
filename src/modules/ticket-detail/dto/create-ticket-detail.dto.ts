import { IsString, IsBoolean, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDetailDto {
  @ApiPropertyOptional({
    description: 'Descripción del detalle del ticket',
    type: String,
    example: 'Se intentó reiniciar la contraseña sin éxito.',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID del usuario que agrega el detalle',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID('4', { message: 'userId debe ser un UUID válido.' })
  userId: string;

  @ApiProperty({
    description: 'ID del ticket al que pertenece el detalle',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'ticketId debe ser un UUID válido.' })
  ticketId: string;

  @ApiPropertyOptional({
    description: 'Estado del detalle del ticket',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
