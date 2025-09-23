import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInDto {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsString( { message: 'The email must be a string.' })
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'The password must be a string.' })
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  password: string;
  
}