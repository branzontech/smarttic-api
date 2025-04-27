import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { 
  ApiBearerAuth, ApiQuery, ApiTags, ApiParam, ApiBody, ApiOperation, ApiResponse 
} from '@nestjs/swagger';
import { ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { User} from 'src/modules/users/entities/user.entity';
import { userSession } from 'src/common/types';

@ApiTags('Users')
@ApiBearerAuth('access-token') 
@Controller('users')
@UseGuards(AuthzGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ description: 'User data to create a new user', type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() createUserDto: CreateUserDto) { 
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      throw new HttpException(`Error creating user: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of users' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to return' })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by name, lastname and email.',
  })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  async findAll(@Query('skip', new ParseIntPipe({ optional: true })) skip = 0, 
                @Query('take', new ParseIntPipe({ optional: true })) take = 100, 
                @Query('filter') filter?: string) {
    return this.usersService.findAll(skip, take, filter);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated user’s profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: User })
  getProfile(@CurrentUser() user: userSession) {    
    return user;
  }

  @Get('companies')
  @ApiOperation({ summary: 'Obtener usuarios con companyName' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios que tienen companyName definido',
  })
  async findAllWithCompanyName(): Promise<{data:Partial<User>[]}> {
    return this.usersService.findAllWithCompanyName();
  }

  @Get('agents/:branchId')
  @ApiOperation({ summary: 'Get agent by branchId' })
  @ApiParam({ name: 'branchId', type: String, description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Agent found', type: User })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findAllAgent(@Param('branchId') id: string) {
    const user = await this.usersService.findAllAgent(id);
    if (!user) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ description: 'User data to update', type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.usersService.update(id, updateUserDto);
      if (!updatedUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return updatedUser;
    } catch (error) {
      throw new HttpException(`Error updating user: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    try {
      return await this.usersService.remove(id);
    } catch (error) {
      throw new HttpException(`Error deleting user: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
