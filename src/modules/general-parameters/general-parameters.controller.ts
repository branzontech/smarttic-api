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
  HttpException,
  ParseIntPipe,
  ConflictException,
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
import { GeneralParametersService } from './general-parameters.service';
import { CreateGeneralParameterDto } from './dto/create-general-parameter.dto';
import { UpdateGeneralParameterDto } from './dto/update-general-parameter.dto';
import { GeneralParameter } from './entities/general-parameter.entity';

@ApiTags('General Parameters')
@ApiBearerAuth('access-token')
@Controller('generalParameter')
@UseGuards(AuthzGuard)
export class GeneralParametersController {
  constructor(private readonly parametersService: GeneralParametersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create general parameter',
    description: 'Creates a new general parameter in the system.',
  })
  @ApiBody({
    description: 'Create a new general parameter',
    type: CreateGeneralParameterDto,
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Parameter successfully created.',
    type: GeneralParameter,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Parameter key already exists.' })
  async create(@Body() createDto: CreateGeneralParameterDto) {
    try {
      return await this.parametersService.create(createDto);
    } catch (error) {
      console.error('Error in create parameter:', error);
      throw new HttpException({ message: error.message }, error.status || 500);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all general parameters',
    description: 'Retrieves a paginated list of all general parameters.',
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
    description: 'Filter by key or description.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of parameters retrieved successfully.',
    type: GeneralParameter,
    isArray: true,
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    try {
      return await this.parametersService.findAll(skip, take, filter);
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Error retrieving parameters list');
    }
  }

  @Get('identificator/:key')
  @ApiOperation({
    summary: 'Get parameter by key',
    description: 'Retrieves a general parameter by its unique key.',
  })
  @ApiParam({
    name: 'key',
    description: 'The key of the parameter to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Parameter details retrieved successfully.',
    type: GeneralParameter,
  })
  @ApiResponse({ status: 404, description: 'Parameter not found.' })
  async findByKey(@Param('key') key: string) {
    try {
      return await this.parametersService.findByKey(key);
    } catch (error) {
      console.error('Error in findByKey:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error retrieving parameter');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get parameter by ID',
    description: 'Retrieves details of a specific parameter by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the parameter to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Parameter details retrieved successfully.',
    type: GeneralParameter,
  })
  @ApiResponse({ status: 404, description: 'Parameter not found.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.parametersService.findOne(id);
    } catch (error) {
      console.error('Error in findOne:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error retrieving parameter');
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update parameter',
    description: 'Updates details of an existing parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the parameter to update',
    type: String,
  })
  @ApiBody({
    description: 'Update parameter details',
    type: UpdateGeneralParameterDto,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Parameter successfully updated.',
    type: GeneralParameter,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Parameter not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGeneralParameterDto,
  ) {
    try {
      return await this.parametersService.update(id, updateDto);
    } catch (error) {
      console.error('Error in update:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error updating parameter');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete parameter',
    description: 'Deletes a parameter from the system (soft delete).',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the parameter to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Parameter successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Parameter not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.parametersService.remove(id);
    } catch (error) {
      console.error('Error in remove:', error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error deleting parameter');
    }
  }
}