import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RolesService } from 'src/modules/roles/roles.service';
import { CreateRoleDto } from 'src/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from 'src/modules/roles/dto/update-role.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token') 
@Controller('roles')
@UseGuards(AuthzGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiQuery({ 
    name: 'skip', 
    required: false, 
    description: 'The number of records to skip before starting to return results. Use this for pagination to retrieve data in chunks.' 
  })
  @ApiQuery({ 
    name: 'take', 
    required: false, 
    description: 'The maximum number of records to return in a single request. Use this to control the size of the response and improve performance.' 
  })  
  async findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return await this.rolesService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.rolesService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(id);
  }
}
