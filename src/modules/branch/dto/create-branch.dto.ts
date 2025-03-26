import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({
    description: 'The name of the branch',
    type: String,
    example: 'Main Branch',
    required: true,
  })
  @IsString({ message: 'The name must be a string.' })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the branch',
    type: String,
    example: 'The main branch located in downtown.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The description must be a string.' })
  description?: string;

  @ApiPropertyOptional({
    description: 'The state of the branch',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'The state must be a boolean.' })
  state?: boolean;
}