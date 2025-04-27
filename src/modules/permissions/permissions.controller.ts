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
import {
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { CreatePermissionDto } from 'src/modules/permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from 'src/modules/permissions/dto/update-permission.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permission')
@UseGuards(AuthzGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new permission',
    description:
      'This endpoint creates a new permission in the system. Provide the permission details in the request body.',
  })
  @ApiBody({
    description: 'Create a new permission',
    type: CreatePermissionDto,
  })
  @ApiResponse({ status: 201, description: 'Permission successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all permissions with pagination',
    description:
      'This endpoint returns a paginated list of all permissions in the system. You can use the `skip` and `take` parameters to control the pagination.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description:
      'The number of records to skip before starting to return results. Use this for pagination to retrieve data in chunks.',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description:
      'The maximum number of records to return in a single request. Use this to control the size of the response and improve performance.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description and name.',
  })
  @ApiResponse({
    status: 201,
    description: 'List of permissions retrieved successfully.',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.permissionsService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get permission by ID',
    description:
      'This endpoint retrieves a specific permission by its ID. Provide the permission ID as a path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the permission to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Permission details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async findById(@Param('id') id: string) {
    return await this.permissionsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update permission details',
    description:
      'This endpoint updates the details of an existing permission by its ID. Provide the permission ID as a path parameter and the updated data in the request body.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the permission to update',
    type: String,
  })
  @ApiBody({
    description: 'Update permission details',
    type: UpdatePermissionDto,
  })
  @ApiResponse({ status: 200, description: 'Permission successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a permission',
    description:
      'This endpoint deletes an existing permission by its ID. Provide the permission ID as a path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the permission to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Permission successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async remove(@Param('id') id: string) {
    return await this.permissionsService.remove(id);
  }
}
