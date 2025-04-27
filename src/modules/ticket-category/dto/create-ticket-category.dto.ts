import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketCategoryDto {
  @ApiProperty({
    description: 'Descripción de la categoría',
    type: String,
    example: 'Soporte Técnico',
    required: true,
  })
  @IsString({ message: 'description debe ser un string.' })
  description: string;

  @ApiProperty({
    description: 'Prefijo único de la categoría',
    type: String,
    example: 'ST',
    required: true,
  })
  @IsString({ message: 'prefix debe ser un string.' })
  prefix: string;

  @ApiPropertyOptional({
    description: 'Estado de la categoría',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;
}
