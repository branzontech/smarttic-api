import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token') 
@Controller('users')
@UseGuards(AuthzGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) { 
    return await this.usersService.create(createUserDto);
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
    return await this.usersService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: UpdateUserDto) {
    return user; // Devuelve el usuario del JWT
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
