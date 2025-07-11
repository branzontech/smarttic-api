import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsBoolean, 
  IsOptional, 
  IsUUID, 
  IsObject,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
class CreateFormResponseDto {
  formId: string;
  responses: Record<string, any>;
}
export class CreateTicketDto {
  @ApiPropertyOptional({
    description: 'Descripción detallada del ticket',
    example: 'No puedo iniciar sesión en el sistema',
    maxLength: 1000,
    required: false
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(1000, { 
    message: 'La descripción no puede exceder los 1000 caracteres' 
  })
  description?: string;

  @ApiProperty({
    description: 'ID del usuario creador (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true
  })
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  // @IsNotEmpty({ message: 'El userId es requerido' })
  userId: string;

  @ApiProperty({
    description: 'ID del título del ticket (UUID v4)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true
  })
  @IsUUID('4', { message: 'El ticketTitleId debe ser un UUID válido' })
  // @IsNotEmpty({ message: 'El ticketTitleId es requerido' })
  ticketTitleId: string;

  @ApiProperty({
    description: 'ID del estado inicial (UUID v4)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: true
  })
  @IsUUID('4', { message: 'El ticketStateId debe ser un UUID válido' })
  // @IsNotEmpty({ message: 'El ticketStateId es requerido' })
  ticketStateId: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal asociada (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
    required: false
  })
  @IsUUID('4', { message: 'El branchId debe ser un UUID válido' })
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'IDs de usuarios asignados (UUID v4)',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8'],
    required: false
  })
  @IsArray({ message: 'Los assignedUsers deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada assignedUser debe ser un UUID válido' })
  @IsOptional()
  assignedUsers?: string[];

  @ApiProperty({
    description: 'Datos del formulario',
    type: CreateFormResponseDto
  })
  @ValidateNested()
  @Type(() => CreateFormResponseDto)
  @IsNotEmpty({ message: 'Los datos del formulario son requeridos' })
  formResponse: CreateFormResponseDto;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del ticket',
    type: Boolean,
    default: true,
    required: false
  })
  @IsBoolean({ message: 'El state debe ser un valor booleano' })
  @IsOptional()
  state: boolean = true;

  @ApiPropertyOptional({
    description: 'Prioridad del ticket (1-5)',
    type: Number,
    minimum: 1,
    maximum: 5,
    default: 3,
    required: false
  })
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(1, { message: 'La prioridad mínima es 1' })
  @Max(5, { message: 'La prioridad máxima es 5' })
  @IsOptional()
  priority?: number = 3;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  files?: any;
}