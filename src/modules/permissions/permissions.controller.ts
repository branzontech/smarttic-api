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
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { CreatePermissionDto } from 'src/modules/permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from 'src/modules/permissions/dto/update-permission.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiBearerAuth('access-token')
@Controller('permissions')
@UseGuards(AuthzGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionsService.create(createPermissionDto);
  }

  @Get()
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
  async findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return await this.permissionsService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.permissionsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.permissionsService.remove(id);
  }
}
