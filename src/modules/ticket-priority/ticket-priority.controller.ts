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
import { TicketPriorityService } from './ticket-priority.service';
import { CreateTicketPriorityDto } from './dto/create-ticket-priority.dto';
import { UpdateTicketPriorityDto } from './dto/update-ticket-priority.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiTags('Ticket Priorities')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('ticketPriority')
export class TicketPriorityController {
  constructor(private readonly ticketPriorityService: TicketPriorityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket priority' })
  @ApiBody({ description: 'Ticket priority data', type: CreateTicketPriorityDto })
  @ApiResponse({ status: 201, description: 'Ticket priority created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTicketPriorityDto: CreateTicketPriorityDto) {
    return await this.ticketPriorityService.create(createTicketPriorityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all ticket priorities with optional pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to return' })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description',
  })
  @ApiResponse({ status: 200, description: 'List of ticket priorities retrieved successfully' })
  async findAll(
        @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
        @Query('take', new ParseIntPipe({ optional: true })) take = 100,
        @Query('filter') filter?: string,
  ) {
    return await this.ticketPriorityService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket priority by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket priority', type: String })
  @ApiResponse({ status: 200, description: 'Ticket priority retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket priority not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketPriorityService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket priority by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket priority to update', type: String })
  @ApiBody({ description: 'Ticket priority update data', type: UpdateTicketPriorityDto })
  @ApiResponse({ status: 200, description: 'Ticket priority updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket priority not found' })
  async update(@Param('id') id: string, @Body() updateTicketPriorityDto: UpdateTicketPriorityDto) {
    return await this.ticketPriorityService.update(id, updateTicketPriorityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket priority by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket priority to delete', type: String })
  @ApiResponse({ status: 200, description: 'Ticket priority deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket priority not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketPriorityService.remove(id);
  }
}
