import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGeneralParameterDto {
  @ApiProperty({
    description: 'Unique key for the parameter',
    type: String,
    example: 'MAX_LOGIN_ATTEMPTS',
  })
  @IsString({ message: 'The key must be a string.' })
  key: string;

  @ApiProperty({
    description: 'Value of the parameter',
    type: String,
    example: '5',
  })
  @IsString({ message: 'The value must be a string.' })
  value: string;

  @ApiProperty({
    description: 'Description of the parameter',
    type: String,
    example: 'Maximum number of login attempts allowed before locking the user.',
  })
  @IsString({ message: 'The description must be a string.' })
  description: string;

  @ApiProperty({
    description: 'Type of the parameter value',
    enum: ['string', 'integer', 'float', 'boolean', 'json'],
    example: 'integer',
  })
  @IsEnum(['string', 'integer', 'float', 'boolean', 'json'], {
    message: 'Type must be one of: string, integer, float, boolean, json.',
  })
  type: 'string' | 'integer' | 'float' | 'boolean' | 'json';
}

