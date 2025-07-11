import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsBoolean, 
  IsOptional, 
  IsNotEmpty,
  Length,
  Matches,
  IsUUID
} from 'class-validator';

export class CreateTicketCategoryDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la categoría',
    example: 'Soporte Técnico',
    maxLength: 100,
    required: true
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(3, 100, { 
    message: 'El nombre debe tener entre 3 y 100 caracteres' 
  })
  name: string;

  @ApiProperty({
    description: 'Descripción detallada de la categoría',
    example: 'Categoría para tickets de soporte técnico general',
    maxLength: 255,
    required: false
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @Length(0, 255, { 
    message: 'La descripción no puede exceder los 255 caracteres' 
  })
  description?: string;

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

  @ApiProperty({
    description: 'ID del formulario template asociado (UUID v4)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false
  })
  @IsUUID('4', { message: 'El formId debe ser un UUID válido' })
  @IsOptional()
  formId?: string;

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