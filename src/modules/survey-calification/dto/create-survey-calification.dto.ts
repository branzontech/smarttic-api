import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSurveyCalificationDto {
  @ApiProperty({
    description: 'Title of the survey calification',
    type: String,
    example: 'Customer Satisfaction Survey',
  })
  @IsString({ message: 'The title must be a string.' })
  title: string;

  @ApiProperty({
    description: 'Description of the survey calification',
    type: String,
    example: 'Survey to measure customer satisfaction with our services.',
  })
  @IsString({ message: 'The description must be a string.' })
  description: string;

  @ApiProperty({
    description: 'Image name associated with the survey calification',
    type: String,
    example: 'survey-image.png',
  })
  @IsString({ message: 'The imageName must be a string.' })
  imageName: string;

  @ApiProperty({
    description: 'Image base 64 associated with the survey calification',
    type: String,
  })
  @IsString({ message: 'The imageBase64 must be a string.' })
  imageBase64: string;

  @ApiPropertyOptional({
    description: 'Indicates if the survey calification is active',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'State must be a boolean value.' })
  @IsOptional()
  state?: boolean = true;
}

