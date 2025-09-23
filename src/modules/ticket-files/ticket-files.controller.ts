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
  ConflictException,
  ParseUUIDPipe,
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
import { TicketFilesService } from './ticket-files.service';
import { createTicketFileDTO } from './dto/create-ticket-file.dto';

@ApiTags('Ticket Files')
@ApiBearerAuth('access-token')
@Controller('ticketFiles')
@UseGuards(AuthzGuard)
export class TicketFilesController {
  constructor(private readonly ticketFilesService: TicketFilesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create ticket file',
    description: 'Creates a new ticket file record in the system.',
  })
  @ApiBody({
    description: 'Data required to create a new ticket file',
    type: createTicketFileDTO,
  })
  @ApiResponse({ status: 201, description: 'Ticket file successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'The file already exists.' })
  async create(@Body() dto: createTicketFileDTO) {
    try {
      return await this.ticketFilesService.create(dto);
    } catch (error) {
      console.error('Error in create TicketFile:', error);
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw new HttpException({ message: error.message }, error.status || 500);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get ticket files',
    description:
      'Returns a paginated list of ticket files, optionally filtered.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description:
      'Number of records to skip before returning results (pagination).',
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
    description: 'Filter by file name, type, or extension.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket files list successfully retrieved.',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 50,
    @Query('filter') filter?: string,
  ) {
    try {
      return await this.ticketFilesService.findAll(skip, take, filter);
    } catch (error) {
      console.error('Error in findAll TicketFiles:', error);
      throw new InternalServerErrorException('Error retrieving ticket files');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get ticket file by ID',
    description: 'Returns the information of a specific ticket file.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket file ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Ticket file found.' })
  @ApiResponse({ status: 404, description: 'Ticket file not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.ticketFilesService.findOne(id);
    } catch (error) {
      console.error('Error in findOne TicketFile:', error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Error retrieving ticket file');
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update ticket file',
    description: 'Updates the information of an existing ticket file.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket file ID',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    description: 'Data to update for the ticket file',
    type: createTicketFileDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket file successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Ticket file not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<createTicketFileDTO>,
  ) {
    try {
      return await this.ticketFilesService.update(id, dto);
    } catch (error) {
      console.error('Error in update TicketFile:', error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException('Error updating ticket file');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete ticket file',
    description: 'Deletes a ticket file from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket file ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket file successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Ticket file not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.ticketFilesService.remove(id);
    } catch (error) {
      console.error('Error in remove TicketFile:', error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException('Error deleting ticket file');
    }
  }
}
