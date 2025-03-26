import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIdentificationTypeDto {
  @ApiProperty({
    description: 'The unique code of the identification type',
    type: String,
    example: 'CC',
    required: true,
  })
  @IsString({ message: 'The code must be a string.' })
  code: string;

  @ApiProperty({
    description: 'The description of the identification type',
    type: String,
    example: 'Cédula de Ciudadanía',
    required: true,
  })
  @IsString({ message: 'The description must be a string.' })
  description: string;

  @ApiPropertyOptional({
    description: 'The state of the identification type',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'The state must be a boolean.' })
  state?: boolean;
}