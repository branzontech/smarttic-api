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
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { 
  ApiBearerAuth, ApiQuery, ApiTags, ApiParam, ApiBody, ApiOperation, ApiResponse, 
  ApiConsumes
} from '@nestjs/swagger';
import { ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { User} from 'src/modules/users/entities/user.entity';
import { columnDataFilter, userSession } from 'src/common/types';
import { ChangePasswordUserDto } from './dto/change-password-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileOptions } from 'src/common/helpers/profile-upload.helper';
import { join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@ApiTags('Users')
@ApiBearerAuth('access-token') 
@Controller('users')
@UseGuards(AuthzGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', profileOptions)) // o 'file'
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new user with profile image' })
  @ApiBody({
    description: 'User data with profile image',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        // agrega aquí otros campos del CreateUserDto
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createUserDto: CreateUserDto
  ) {
    try {
      if (image) {
        createUserDto.profileImageName = image.filename;
      }
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
                @Query('filter') filter?: string,
                @Query('columnFilters') columnFilters?: columnDataFilter[]) {
    return this.usersService.findAll(skip, take, filter, columnFilters);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated user’s profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: User })
  getProfile(@CurrentUser() user: userSession) {    
    return user;
  }

  @Get('image/:filename')
    @ApiOperation({ summary: 'Ver o descargar archivo asociado a una respuesta' })
    @ApiParam({ name: 'filename', type: String, description: 'Nombre del archivo' })
    async serveFile(@Param('filename') filename: string, @Res() res: Response) {
      const filePath = join(__dirname, '..', '..', '..', 'uploads/users/profiles/', filename);
  
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Archivo no encontrado');
      }
  
      return res.sendFile(filePath);
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

  @Patch('changePassword')
  @ApiOperation({ summary: 'Update password user' })
  @ApiBody({ description: 'User data to change password', type: ChangePasswordUserDto })
  @ApiResponse({ status: 200, description: 'User change password successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async changePassword( @CurrentUser() user: userSession, @Body() changePasswordUserDto: ChangePasswordUserDto) {
     try {
      return await this.usersService.changePassword(
        user.id, 
        changePasswordUserDto.newPassword, 
        changePasswordUserDto.confirmNewPassword
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException(
        'Se produjo un error inesperado al cambiar la contraseña.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', profileOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizar los detalles del usuario, incluido el reemplazo de la imagen del perfil' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ description: 'Datos de usuario a actualizar', type: UpdateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario actualizado correctamente', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto
  ) {
    try {
      const existingUser = await this.usersService.findById(id);
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Si se sube una nueva imagen
      if (image) {
        // Elimina la imagen anterior si existe
        if (existingUser.profileImageName) {
          const oldImagePath = join(__dirname, '..', '..', '..', 'uploads/users/profiles', existingUser.profileImageName);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Asigna la nueva imagen
        updateUserDto.profileImageName = image.filename;
      }

      return await this.usersService.update(id, updateUserDto);
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
