import {
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordUserDto {
  @ApiProperty({
    description: 'The newPassword of the user',
    type: String,
    required: true,
  })
  @IsString({ message: 'The newPassword must be a string.' })
  newPassword: string;

  @ApiProperty({
    description: 'The confirmNewPassword of the user',
    type: String,
    required: true,
  })
  @IsString({ message: 'The confirmNewPassword must be a string.' })
  confirmNewPassword: string;

 
}