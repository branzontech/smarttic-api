import { PartialType } from '@nestjs/swagger';
import { CreateAssignedUserBranchDto } from './create-assigned-user-branch.dto';

export class UpdateAssignedUserBranchDto extends PartialType(CreateAssignedUserBranchDto) {}
