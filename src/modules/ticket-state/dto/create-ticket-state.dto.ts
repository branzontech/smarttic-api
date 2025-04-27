import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketStateDto {
  @ApiProperty({
    description: 'Título del estado del ticket',
    type: String,
    example: 'En Proceso',
    required: true,
  })
  @IsString({ message: 'title debe ser un string.' })
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción del estado del ticket',
    type: String,
    example: 'El ticket está en proceso de solución.',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Orden en el flujo de estados del ticket',
    type: Number,
    example: 2,
  })
  @IsNumber({}, { message: 'orderTicket debe ser un número.' })
  @IsOptional()
  orderTicket?: number;

  @ApiPropertyOptional({
    description: 'Estado del registro del estado del ticket',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
