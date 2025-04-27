import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({
    description: 'The description of the menu',
    type: String,
    example: 'Dashboard',
    required: true,
  })
  @IsString({ message: 'The description must be a string.' })
  description: string;

  @ApiProperty({
    description: 'The ID of the parent menu',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    default: null,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The father must be a string.' })
  father: string;

  @ApiProperty({
    description: 'The name of the view',
    type: String,
    example: 'dashboard-view',
    default: null,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The nameView must be a string.' })
  nameView: string;

  @ApiProperty({
    description: 'The CSS class for the icon',
    type: String,
    example: 'fas fa-home',
    required: true,
  })
  @IsString({ message: 'The classIcon must be a string.' })
  classIcon: string;

  @ApiProperty({
    description: 'The order of the menu item',
    type: Number,
    example: 1,
    required: true,
  })
  @IsInt({ message: 'The orderItem must be an integer.' })
  orderItem: number;

  @ApiPropertyOptional({
    description: 'The state of the menu',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'The state must be a boolean.' })
  state?: boolean;
}
