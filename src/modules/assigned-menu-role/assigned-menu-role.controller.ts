import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { AssignedMenuRoleService } from 'src/modules/assigned-menu-role/assigned-menu-role.service';
import { AssignMenuRoleDto } from 'src/modules/assigned-menu-role/dto/assign-menu-role.dto';

@ApiTags('Assigned Menu Role')
@ApiBearerAuth('access-token')
@Controller('assignedMenuRole')
@UseGuards(AuthzGuard)
export class AssignedMenuRoleController {
  constructor(private readonly assignedMenuRoleService: AssignedMenuRoleService) {}

  @Post('assignAccessLevel')
  @ApiOperation({ summary: 'Assign access levels', description: 'Assigns menu access levels to a role.' })
  @ApiBody({
    description: 'Role ID and menu permissions to assign',
    type: AssignMenuRoleDto,
  })
  @ApiResponse({ status: 200, description: 'Access level assigned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async assignAccessLevel(@Body() data: AssignMenuRoleDto) {
    const { roleId, dataMenu } = data;

    if (!roleId || !Array.isArray(dataMenu) || dataMenu.length === 0) {
      throw new BadRequestException('roleId and dataMenu are required and must be valid.');
    }

    return await this.assignedMenuRoleService.assignAccessLevel(roleId, dataMenu);
  }
}
