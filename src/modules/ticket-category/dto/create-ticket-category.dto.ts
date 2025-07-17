import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsBoolean, 
  IsOptional, 
  IsNotEmpty,
  Length,
  Matches
} from 'class-validator';

export class CreateTicketCategoryDto {

  @ApiProperty({
    description: 'Descripción detallada de la categoría',
    example: 'Categoría para tickets de soporte técnico general',
    maxLength: 255,
    required: false
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Length(0, 255, { 
    message: 'La descripción no puede exceder los 255 caracteres' 
  })
  description: string;

  @ApiProperty({
    description: 'Prefijo único para identificación de tickets (2-5 caracteres alfanuméricos)',
    example: 'ST',
    minLength: 2,
    maxLength: 5,
    required: true
  })
  @IsString({ message: 'El prefijo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El prefijo es requerido' })
  @Length(2, 5, { 
    message: 'El prefijo debe tener entre 2 y 5 caracteres' 
  })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'El prefijo solo puede contener letras mayúsculas y números'
  })
  prefix: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo de la categoría',
    type: Boolean,
    default: true,
    required: false
  })
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  @IsOptional()
  state: boolean = true;
}