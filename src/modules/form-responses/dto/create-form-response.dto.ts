import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsObject, 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsUUID,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormResponseDto {
  @ApiProperty({
    description: 'Respuestas del formulario en formato clave-valor',
    type: Object,
    example: {
      problema: 'Error de conexión',
      urgencia: 'alta',
      detalles: 'No puedo acceder al sistema desde ayer'
    },
    required: true
  })
  @IsObject({ message: 'Las respuestas deben ser un objeto válido' })
  @IsNotEmpty({ message: 'Las respuestas son requeridas' })
  responses: Record<string, any>;

  @ApiProperty({
    description: 'ID del formulario relacionado (UUID v4)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: true
  })
  @IsUUID('4', { message: 'El formId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El formId es requerido' })
  formId: string;

  @ApiProperty({
    description: 'ID del ticket relacionado (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true
  })
  @IsUUID('4', { message: 'El ticketId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ticketId es requerido' })
  ticketId: string;

}