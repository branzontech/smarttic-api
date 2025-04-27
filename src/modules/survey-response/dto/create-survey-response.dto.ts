import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSurveyResponseDto {
  @ApiProperty({
    description: 'UUID of the related survey calification',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'surveyCalificationId must be a valid UUID.' })
  surveyCalificationId: string;

  @ApiProperty({
    description: 'UUID of the user who responded to the survey',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'userId must be a valid UUID.' })
  userId: string;

  @ApiProperty({
    description: 'UUID of the associated ticket',
    type: String,
    example: '987f6543-b21a-4c3d-89ef-987654321000',
  })
  @IsUUID('4', { message: 'ticketId must be a valid UUID.' })
  ticketId: string;


  
}

