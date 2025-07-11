import { ApiProperty } from '@nestjs/swagger';

export class SeriesItemDto {
  @ApiProperty({ example: 'John Doe', description: 'Agent full name' })
  name: string;

  @ApiProperty({ 
    example: [5, 10, 8], 
    description: 'Array of resolved tickets count per month' 
  })
  data: number[];
}

export class PerformanceResponseDto {
  @ApiProperty({ example: 'Agent Performance', description: 'Report title' })
  title: string;

  @ApiProperty({ example: 'Total agents: 4', description: 'Report description' })
  description: string;

  @ApiProperty({ 
    example: ['Jan', 'Feb', 'Mar'], 
    description: 'Month labels included in the report' 
  })
  categories: string[];

  @ApiProperty({ 
    type: [SeriesItemDto],
    example: [
      { name: 'John Doe', data: [5, 10, 8] },
      { name: 'Jane Smith', data: [3, 7, 6] }
    ],
    description: 'Performance data by agent' 
  })
  series: SeriesItemDto[];
}