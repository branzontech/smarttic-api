import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignMenuRoleDto {
  @ApiProperty({ description: 'Role ID to assign permissions', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  roleId: string;

  @ApiProperty({ description: 'Array of menu IDs to assign', type: [String], example: ['menu1', 'menu2', 'menu3'] })
  @IsArray()
  @ArrayNotEmpty()
  dataMenu: string[];
}
