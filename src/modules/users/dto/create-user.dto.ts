import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'The name of the user',
    type: String,
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The name must be a string.' })
  name?: string | null;

  @ApiPropertyOptional({
    description: 'The lastname of the user',
    type: String,
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The lastname must be a string.' })
  lastname?: string | null;

  @ApiProperty({
    description: 'The companyname of the user',
    type: String,
    example: 'Company Inc.',
    required: false,
  })
  @IsString({ message: 'The companyname must be a string.' })
  companyname: string;

  @ApiPropertyOptional({
    description: 'The companyId type ID for the user',
    type: String,
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'The companyId must be a valid UUID.' })
  companyId?: string;

  @ApiProperty({
    description: 'The address of the user',
    type: String,
    example: '123 Main St',
    required: true,
  })
  @IsString({ message: 'The address must be a string.' })
  address: string;

  @ApiPropertyOptional({
    description: 'The phone number of the user',
    type: Number,
    example: 1234567890,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'The phone must be a number.' })
  phone?: number;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
    example: 'john.doe@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'The email must be a valid email address.' })
  email: string;

  @ApiProperty({
    description: 'The username of the user',
    type: String,
    example: 'johndoe123',
    minLength: 6,
    required: true,
  })
  @IsOptional()
  @IsString({ message: 'The username must be a string.' })
  // @MinLength(6, { message: 'The username must be at least 6 characters long.' })
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    example: 'password123',
    minLength: 6,
    required: true,
  })
  @IsString({ message: 'The password must be a string.' })
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  password: string;

  @ApiProperty({
    description: 'The role ID for the user',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'The roleId must be a valid UUID.' })
  roleId: string;

  @ApiPropertyOptional({
    description: 'The identification type ID for the user',
    type: String,
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'The identificationTypeId must be a valid UUID.' })
  identificationTypeId?: string;

  @ApiPropertyOptional({
    description: 'The identification number for the user',
    type: String,
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The numberIdentification must be a string.' })
  numberIdentification?: string;

  @ApiPropertyOptional({
    description: 'The branch ID for the user',
    type: String,
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim(); // UUID como string
    }
    return value;
  })
  @IsUUID('4', { message: 'The branchId must be a valid UUID.' })
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Array of branch IDs for the user',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p',
      'z9y8x7w6-v5u4-t3s2-r1q0-p0o9n8m7l6k5',
    ],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return value.split(',').map((v: string) => v.trim());
      }
    }
    return [];
  })
  @IsArray({ message: 'branches must be an array.' })
  @IsUUID('4', { each: true, message: 'Each branch ID must be a valid UUID.' })
  branches?: string[];

  @ApiPropertyOptional({
    description: 'Indicates if the user is a default agent',
    type: Boolean,
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'The isAgentDefault must be a boolean.' })
  isAgentDefault?: boolean;

  @ApiProperty({
    description: 'Limit of tickets that the agent can manage',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'The limit must be a number.' })
  @Min(0, { message: 'The ticket limit cannot be negative.' })
  limite_ticket: number;

  @ApiProperty({
    description: 'Edad del usuarios',
    type: Number,
    example: 25,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Tla edad debe se run numero' })
  @Min(0, { message: 'la edad no debe ser negativo.' })
  age: number;

  @IsOptional()
  @IsString()
  profileImageName?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the user is the designated approving usuario',
    type: Boolean,
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({
    message: 'The isDesignatedApprover field must be a boolean value.',
  })
  isDesignatedApprover?: boolean;

  @ApiPropertyOptional({
    description: 'The state of the user',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'The state must be a boolean.' })
  @Transform(({ value }) => value === 'true' || value === true)
  state?: boolean;
}
