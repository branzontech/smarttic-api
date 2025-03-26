import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty({
    description: 'The ID of the user associated with the audit log',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'The userId must be a valid UUID string.' })
  userId: string;

  @ApiProperty({
    description: 'The endpoint that was accessed',
    type: String,
    example: '/api/users',
    required: true,
  })
  @IsString({ message: 'The endpoint must be a string.' })
  endpoint: string;

  @ApiProperty({
    description: 'The HTTP method used for the request',
    type: String,
    example: 'GET',
    required: true,
  })
  @IsString({ message: 'The method must be a string.' })
  method: string;

  @ApiProperty({
    description: 'The status of the request',
    type: String,
    example: '200 OK',
    required: true,
  })
  @IsString({ message: 'The status must be a string.' })
  status: string;

  @ApiProperty({
    description: 'A message describing the audit log entry',
    type: String,
    example: 'User retrieved successfully',
    required: true,
  })
  @IsString({ message: 'The message must be a string.' })
  message: string;
}