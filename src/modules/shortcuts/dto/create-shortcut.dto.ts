import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateShortcutDto {
 @ApiProperty({
    description: 'IDs de los menús seleccionados como accesos directos',
    example: [
      'd3aef022-3d75-45b3-a0d6-b8c4e58c3b7c',
      '7b34a0af-39fb-47f1-b01f-09dc109b6f24',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  menuIds: string[];
}

