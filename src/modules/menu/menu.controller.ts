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
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  HttpException,
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
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { MenuService } from 'src/modules/menu/menu.service';
import { CreateMenuDto } from 'src/modules/menu/dto/create-menu.dto';
import { UpdateMenuDto } from 'src/modules/menu/dto/update-menu.dto';

@ApiTags('Menu')
@ApiBearerAuth('access-token')
@Controller('menu')
@UseGuards(AuthzGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({
    summary: 'Create menu',
    description: 'Creates a new menu item in the system.',
  })
  @ApiBody({
    description: 'Create a new menu item',
    type: CreateMenuDto,
  })
  @ApiResponse({ status: 201, description: 'Menu successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'NameView already exists.' })
  async create(@Body() createMenuDto: CreateMenuDto) {
    try {
      return await this.menuService.create(createMenuDto);
    } catch (error) {
      console.error('Error in create menu:', error);
      throw new HttpException({ message: error.message }, error.status || 500);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all menu items',
    description: 'Retrieves a paginated list of all menu items.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description:
      'Number of records to skip before returning results (for pagination).',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Maximum number of records to return in a single request.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description, father and nameView.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of menu items retrieved successfully.',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    try {
      return await this.menuService.findAll(skip, take, filter);
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Error retrieving menu list');
    }
  }

  @Get('fathers')
  @ApiOperation({
    summary: 'Get menus fathers',
    description:
      'Returns all menu items fathers (filtered by role state and deletedAt).',
  })
  @ApiParam({
    name: 'roleId',
    description: 'The ID of the role to filter menu items by.',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully.' })
  @ApiResponse({
    status: 404,
    description: 'No menus found for the given role ID.',
  })
  async findMenusFathers() {
    try {
      const response = await this.menuService.findMenusFather();

      return response;
    } catch (error) {
      console.error('Error in findMenusFathers:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving menus fathers');
    }
  }

  @Get('role/:roleId')
  @ApiOperation({
    summary: 'Get menus by Role ID',
    description:
      'Returns all menu items assigned to a specific role (filtered by role state and deletedAt).',
  })
  @ApiParam({
    name: 'roleId',
    description: 'The ID of the role to filter menu items by.',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully.' })
  @ApiResponse({
    status: 404,
    description: 'No menus found for the given role ID.',
  })
  async findMenusByRole(@Param('roleId') roleId: string) {
    try {
      const menus = await this.menuService.findMenusByRoleId(roleId);
      if (!menus.length) {
        throw new NotFoundException('No menus found for this role ID');
      }
      return menus;
    } catch (error) {
      console.error('Error in findMenusByRole:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving menus by role');
    }
  }

  @Get('permission/:roleId')
  @ApiOperation({
    summary: 'Get menus by Role ID',
    description:
      'Returns all menu items assigned to a specific role (filtered by role state and deletedAt).',
  })
  @ApiParam({
    name: 'roleId',
    description: 'The ID of the role to filter menu items by.',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully.' })
  @ApiResponse({
    status: 404,
    description: 'No menus found for the given role ID.',
  })
  async findAllMenusPermissionByRoleId(@Param('roleId') roleId: string) {
    try {
      const menus =
        await this.menuService.findAllMenusPermissionByRoleId(roleId);

      return menus;
    } catch (error) {
      console.error('Error in findAllMenusPermissionByRole:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving menus by role');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get menu item by ID',
    description: 'Retrieves details of a specific menu item by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the menu item to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Menu item details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.menuService.findOne(id);
    } catch (error) {
      console.error('Error in findOne:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error retrieving menu item');
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update menu item',
    description: 'Updates details of an existing menu item.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the menu item to update',
    type: String,
  })
  @ApiBody({
    description: 'Update menu item details',
    type: UpdateMenuDto,
  })
  @ApiResponse({ status: 200, description: 'Menu item successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    try {
      return await this.menuService.update(id, updateMenuDto);
    } catch (error) {
      console.error('Error in update:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('Error updating menu item');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete menu item',
    description: 'Deletes a menu item from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the menu item to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Menu item successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.menuService.remove(id);
    } catch (error) {
      console.error('Error in remove:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error deleting menu item');
    }
  }
}
