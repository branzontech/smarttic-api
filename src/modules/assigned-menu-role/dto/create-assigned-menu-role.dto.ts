import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignedMenuRoleDto {
  @ApiProperty({
    description: 'The ID of the menu',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString({ message: 'The menuId must be a string.' })
  menuId: string;

  @ApiProperty({
    description: 'The ID of the role',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: true,
  })
  @IsString({ message: 'The roleId must be a string.' })
  roleId: string;
}