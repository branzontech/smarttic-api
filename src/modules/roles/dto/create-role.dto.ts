import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    type: String,
    example: 'Admin',
    required: true,
  })
  @IsString({ message: 'The name must be a string.' })
  name: string;

  @ApiPropertyOptional({
    description: 'Indicates if the role is for an agent',
    type: Boolean,
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'isAgent must be a boolean value.' })
  @IsOptional()
  isAgent?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates if the role is for an admin',
    type: Boolean,
    example: true,
    default: false,
  })
  @IsBoolean({ message: 'isAdmin must be a boolean value.' })
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates if the role is for a configurator',
    type: Boolean,
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'isConfigurator must be a boolean value.' })
  @IsOptional()
  isConfigurator?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates if the role is active',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state must be a boolean value.' })
  @IsOptional()
  state?: boolean;
}