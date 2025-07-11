import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFormFieldDto } from 'src/modules/form-fields/dto/create-form-field.dto';

export class CreateFormDto {
  @ApiProperty({
    description: 'Nombre del formulario',
    example: 'Formulario de contacto',
    maxLength: 255
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del formulario',
    example: 'Formulario para contactar al equipo de soporte',
    required: false
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto válida' })
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Indica si es un template reusable',
    default: true,
    example: false
  })
  @IsBoolean({ message: 'isTemplate debe ser un valor booleano (true/false)' })
  @IsOptional()
  isTemplate: boolean = false;

  @ApiProperty({
    description: 'Indica si el formulario está activo',
    default: true,
    example: true
  })
  @IsBoolean({ message: 'isActive debe ser un valor booleano (true/false)' })
  @IsOptional()
  isActive: boolean = true;

  @ApiProperty({
    description: 'Versión del formulario',
    default: 1,
    minimum: 1,
    example: 1
  })
  @IsInt({ message: 'La versión debe ser un número entero' })
  @Min(1, { message: 'La versión mínima es 1' })
  @IsOptional()
  version: number = 1;

  @ApiPropertyOptional({
    description: 'IDs de títulos a asociar (solo para formularios no templates)',
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    required: false
  })
  @IsArray({ message: 'titleIds debe ser un array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de título debe ser un UUID válido (v4)'
  })
  @IsOptional()
  titles?: string[];

  @ApiPropertyOptional({
    description: 'Campos del formulario',
    type: [CreateFormFieldDto],
    example: [{
      label: 'Nombre completo',
      fieldKey: 'fullName',
      type: 'text',
      isRequired: true,
      order: 1,
      validations: { minLength: 3, maxLength: 100 }
    }],
    required: false
  })
  @IsArray({ message: 'Los campos deben enviarse como un array' })
  @ValidateNested({
    each: true,
    message: 'Cada campo debe tener una estructura válida'
  })
  @Type(() => CreateFormFieldDto)
  @IsOptional()
  fields?: CreateFormFieldDto[];
}