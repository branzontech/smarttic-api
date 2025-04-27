import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketPriorityDto {
  @ApiProperty({
    description: 'Título de la prioridad',
    type: String,
    example: 'Alta',
    required: true,
  })
  @IsString({ message: 'title debe ser un string.' })
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción de la prioridad',
    type: String,
    example: 'Tickets que deben resolverse en menos de 24 horas',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Horas estimadas para la respuesta',
    type: Number,
    example: 2,
  })
  @IsNumber({}, { message: 'hoursResponse debe ser un número.' })
  @IsOptional()
  hoursResponse?: number;

  @ApiPropertyOptional({
    description: 'Horas estimadas para la resolución',
    type: Number,
    example: 8,
  })
  @IsNumber({}, { message: 'hoursResolution debe ser un número.' })
  @IsOptional()
  hoursResolution?: number;

  @ApiPropertyOptional({
    description: 'Estado de la prioridad',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
