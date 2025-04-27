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
import { TicketStateService } from './ticket-state.service';
import { CreateTicketStateDto } from './dto/create-ticket-state.dto';
import { UpdateTicketStateDto } from './dto/update-ticket-state.dto';
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

@ApiTags('Ticket States')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('ticketStates')
export class TicketStateController {
  constructor(private readonly ticketStateService: TicketStateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket state' })
  @ApiBody({ description: 'Ticket state data', type: CreateTicketStateDto })
  @ApiResponse({ status: 201, description: 'Ticket state created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTicketStateDto: CreateTicketStateDto) {
    return await this.ticketStateService.create(createTicketStateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all ticket states with optional pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to return' })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description',
  })
  @ApiResponse({ status: 200, description: 'List of ticket states retrieved successfully' })
  async findAll(
      @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
      @Query('take', new ParseIntPipe({ optional: true })) take = 100,
      @Query('filter') filter?: string,
    ) {
    return await this.ticketStateService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket state by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket state', type: String })
  @ApiResponse({ status: 200, description: 'Ticket state retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket state not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketStateService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket state by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket state to update', type: String })
  @ApiBody({ description: 'Ticket state update data', type: UpdateTicketStateDto })
  @ApiResponse({ status: 200, description: 'Ticket state updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket state not found' })
  async update(@Param('id') id: string, @Body() updateTicketStateDto: UpdateTicketStateDto) {
    return await this.ticketStateService.update(id, updateTicketStateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket state by ID' })
  @ApiParam({ name: 'id', description: 'ID of the ticket state to delete', type: String })
  @ApiResponse({ status: 200, description: 'Ticket state deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket state not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketStateService.remove(id);
  }
}
