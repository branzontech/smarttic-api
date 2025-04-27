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
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { userSession } from 'src/common/types';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ description: 'Create a new ticket', type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createTicketDto: Partial<CreateTicketDto>,
    @CurrentUser() user: userSession,
  ) {
    return await this.ticketService.create(createTicketDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all tickets with optional pagination' })
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
    description: 'Filter by description.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
  })
  async findAll(
    @CurrentUser() user: userSession,
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.ticketService.findAll(user, skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to retrieve',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketService.findOne(id);
  }

  @Patch('assist/:id')
  @ApiOperation({ summary: 'Update ticket status to Assisted' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update to Assisted status',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated to Assisted successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket or status not found' })
  @ApiResponse({ status: 500, description: 'Failed to update ticket status' })
  async updateStatusToAssisted(@Param('id') id: string) {
    return await this.ticketService.updateStatusToAssisted(id);
  }

  @Patch('closet/:id')
  @ApiOperation({ summary: 'Update ticket status to Closet' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update to Closet status',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated to Closet successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket or status not found' })
  @ApiResponse({ status: 500, description: 'Failed to update ticket status' })
  async updateStatusToCloseted(@Param('id') id: string) {
    return await this.ticketService.updateStatusToCloseted(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update',
    type: String,
  })
  @ApiBody({ description: 'Update ticket details', type: UpdateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketService.remove(id);
  }
}
