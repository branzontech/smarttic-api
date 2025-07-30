import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLaborHourDto {
  @ApiProperty({
    description: 'Day of the week as a number (0 = Monday, 6 = Sunday)',
    example: 0,
  })
  @IsInt({ message: 'Day of week must be an integer.' })
  @Min(0, { message: 'Day of week must be between 0 and 6.' })
  @Max(6, { message: 'Day of week must be between 0 and 6.' })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '08:00',
  })
  @IsString({ message: 'Start time must be a string.' })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '17:00',
  })
  @IsString({ message: 'End time must be a string.' })
  endTime: string;

  @ApiPropertyOptional({ description: 'Break start time', example: '12:00' })
  @IsOptional()
  @IsString()
  startBreak?: string | null;

  @ApiPropertyOptional({ description: 'Break end time', example: '13:00' })
  @IsOptional()
  @IsString()
  endBreak?: string | null;

  @ApiProperty({
    description: 'ID of the branch this labor hour belongs to',
    example: 'e801630d-0546-445f-85cf-34d5169e4091',
  })
  @IsString({ message: 'Branch ID must be a string.' })
  branchId: string;

  @ApiPropertyOptional({
    description: 'Whether this labor hour is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean.' })
  isActive?: boolean = true;
}
