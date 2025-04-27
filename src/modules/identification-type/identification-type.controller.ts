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
  ApiBody,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { IdentificationTypeService } from 'src/modules/identification-type/identification-type.service';
import { CreateIdentificationTypeDto } from 'src/modules/identification-type/dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from 'src/modules/identification-type/dto/update-identification-type.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiTags('Identification Types')
@ApiBearerAuth('access-token')
@Controller('identificationTypes')
@UseGuards(AuthzGuard)
export class IdentificationTypeController {
  constructor(
    private readonly identificationTypeService: IdentificationTypeService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new identification type',
    description: 'Creates a new identification type with the provided details.',
  })
  @ApiBody({
    description: 'Create a new identification type',
    type: CreateIdentificationTypeDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Identification type successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(
    @Body() createIdentificationTypeDto: CreateIdentificationTypeDto,
  ) {
    return await this.identificationTypeService.create(
      createIdentificationTypeDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all identification types',
    description: 'Fetches a list of all available identification types.',
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
    description: 'Filter by description and code.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of identification types retrieved successfully.',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.identificationTypeService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an identification type by ID',
    description:
      'Fetches a single identification type using its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the identification type to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Identification type retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Identification type not found.' })
  async findById(@Param('id') id: string) {
    return await this.identificationTypeService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an identification type',
    description:
      'Updates the details of an existing identification type using its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the identification type to update',
    type: String,
  })
  @ApiBody({
    description: 'Update identification type details',
    type: UpdateIdentificationTypeDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Identification type successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Identification type not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateIdentificationTypeDto: UpdateIdentificationTypeDto,
  ) {
    return await this.identificationTypeService.update(
      id,
      updateIdentificationTypeDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an identification type',
    description: 'Removes an identification type from the system using its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the identification type to delete',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Identification type successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Identification type not found.' })
  async remove(@Param('id') id: string) {
    return await this.identificationTypeService.remove(id);
  }
}
