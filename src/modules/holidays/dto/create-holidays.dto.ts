import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'Date of the holiday in YYYY-MM-DD format',
    example: '2020-01-01',
  })
  @IsString({ message: 'Date must be a string.' })
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Name of the holiday',
    example: "New Year's Day",
  })
  @IsString({ message: 'Name must be a string.' })
  name: string;

  @ApiProperty({
    description: 'ID of the branch this holiday belongs to',
    example: 'e801630d-0546-445f-85cf-34d5169e4091',
    required: false,
    nullable: true,
  })
  @IsString({ message: 'Branch ID must be a string.' })
  branchId: string;
}
