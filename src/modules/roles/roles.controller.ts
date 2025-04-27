import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from 'src/modules/roles/roles.service';
import { CreateRoleDto } from 'src/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from 'src/modules/roles/dto/update-role.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(AuthzGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new role',
    description:
      'This endpoint creates a new role in the system based on the provided role data.',
  })
  @ApiBody({
    description: 'Create a new role',
    type: CreateRoleDto,
  })
  @ApiResponse({ status: 201, description: 'Role successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all roles with pagination',
    description:
      'This endpoint returns a paginated list of all roles in the system. Use the `skip` and `take` parameters for pagination.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description:
      'The number of records to skip before starting to return results. Use this for pagination.',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description:
      'The maximum number of records to return in a single request. Use this to control the size of the response.',
    example: 10,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by name',
  })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.rolesService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description:
      'This endpoint retrieves a single role by its ID. Provide the role ID as a path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the role to retrieve',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findById(@Param('id') id: string) {
    return await this.rolesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update role details',
    description:
      'This endpoint updates the details of an existing role by its ID. Provide the role ID as a path parameter and the updated data in the request body.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the role to update',
    type: String,
  })
  @ApiBody({
    description: 'Update role details',
    type: UpdateRoleDto,
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a role',
    description:
      'This endpoint deletes an existing role by its ID. Provide the role ID as a path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the role to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(id);
  }
}
