import { PartialType } from '@nestjs/swagger';
import { CreateAssignedMenuRoleDto } from './create-assigned-menu-role.dto';

export class UpdateAssignedMenuRoleDto extends PartialType(CreateAssignedMenuRoleDto) {}
