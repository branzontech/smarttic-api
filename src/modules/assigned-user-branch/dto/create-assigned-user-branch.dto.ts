import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignedUserBranchDto {
  @ApiProperty({
    description: 'The ID of the branch',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'The branchId must be a valid UUID.' })
  branchId: string;

  @ApiProperty({
    description: 'The ID of the user',
    type: String,
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p',
    required: true,
  })
  @IsUUID('4', { message: 'The userId must be a valid UUID.' })
  userId: string;

}
