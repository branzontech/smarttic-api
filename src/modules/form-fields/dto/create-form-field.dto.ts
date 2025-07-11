// src/modules/form-field/dto/create-form-field.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean, 
  IsNumber, 
  IsOptional, 
  IsString, 
  IsIn, 
  IsObject,
  Min,
  Max,
  MaxLength,
  IsNotEmpty
} from 'class-validator';
import { FIELD_TYPES } from 'src/common/constants';

export class CreateFormFieldDto {
  @ApiProperty({
    description: 'Etiqueta visible del campo',
    example: 'Nombre completo',
    maxLength: 255,
    required: true
  })
  @IsString({ message: 'label debe ser de tipo string' })
  @IsNotEmpty({ message: 'label es requerido' })
  @MaxLength(255, { message: 'label excede el máximo de 255 caracteres' })
  label: string;

  @ApiProperty({
    description: 'Identificador único del campo (usado en respuestas)',
    example: 'nombreCompleto',
    maxLength: 255,
    required: true
  })
  @IsString({ message: 'fieldKey debe ser de tipo string' })
  @IsNotEmpty({ message: 'fieldKey es requerido' })
  @MaxLength(255, { message: 'fieldKey excede el máximo de 255 caracteres' })
  fieldKey: string;

  @ApiProperty({
    description: `Tipo de campo. Valores permitidos: ${FIELD_TYPES.join(', ')}`,
    example: 'text',
    enum: FIELD_TYPES,
    required: true
  })
  @IsString({ message: 'type debe ser de tipo string' })
  @IsIn(FIELD_TYPES, { 
    message: `type debe ser uno de: ${FIELD_TYPES.join(', ')}` 
  })
  type: typeof FIELD_TYPES[number];

  @ApiProperty({
    description: 'Configuración de opciones para campos de selección',
    type: Object,
    required: false,
    example: { 
      options: ['Opción 1', 'Opción 2'], 
      multiple: false 
    }
  })
  @IsObject({ message: 'options debe ser un objeto válido' })
  @IsOptional()
  options?: Record<string, any>;

  @ApiProperty({
    description: 'Indica si el campo es obligatorio',
    type: Boolean,
    default: false,
    required: false
  })
  @IsBoolean({ message: 'isRequired debe ser de tipo boolean' })
  @IsOptional()
  isRequired: boolean = false;

  @ApiProperty({
    description: 'Posición del campo en el formulario',
    minimum: 0,
    maximum: 100,
    example: 1,
    required: true
  })
  @IsNumber({}, { message: 'order debe ser de tipo number' })
  @Min(0, { message: 'order no puede ser menor a 0' })
  @Max(100, { message: 'order no puede ser mayor a 100' })
  order: number;

  @ApiProperty({
    description: 'Reglas de validación personalizadas',
    type: Object,
    required: false,
    example: { 
      minLength: 3, 
      maxLength: 50, 
      pattern: '^[a-zA-Z ]*$' 
    }
  })
  @IsObject({ message: 'validations debe ser un objeto válido' })
  @IsOptional()
  validations?: Record<string, any>;

  @ApiProperty({
    description: 'Valor predeterminado del campo',
    example: 'Valor por defecto',
    maxLength: 500,
    required: false
  })
  @IsString({ message: 'defaultValue debe ser de tipo string' })
  @IsOptional()
  @MaxLength(500, { message: 'defaultValue excede el máximo de 500 caracteres' })
  defaultValue?: string;
}