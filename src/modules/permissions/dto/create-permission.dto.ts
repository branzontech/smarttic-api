import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'The endpoint associated with the permission',
    type: String,
    example: '/api/users',
    required: true,
  })
  @IsString({ message: 'The endpoint must be a string.' })
  endpoint: string;

  @ApiProperty({
    description: 'The HTTP methods allowed for the endpoint',
    type: [String],
    example: ['GET', 'POST'],
    required: true,
  })
  @IsArray({ message: 'The methods must be an array.' })
  @IsString({ each: true, message: 'Each method must be a string.' })
  methods: string[];

  @ApiPropertyOptional({
    description: 'The ID of the role associated with the permission',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'The roleId must be a valid UUID.' })
  roleId?: string;
}