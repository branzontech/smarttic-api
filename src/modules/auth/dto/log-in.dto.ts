import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInDto {
  @ApiProperty({
    description: 'The username of the user',
    type: String,
  })
  @IsString( { message: 'The username must be a string.' })
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'The password must be a string.' })
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  password: string;
  
}