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
import { ApiBearerAuth, ApiQuery, ApiBody, ApiParam, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { TicketTitleService } from './ticket-title.service';
import { CreateTicketTitleDto } from './dto/create-ticket-title.dto';
import { UpdateTicketTitleDto } from './dto/update-ticket-title.dto';
import { ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@ApiTags('Ticket Titles')  
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('ticketTitle')
export class TicketTitleController {
  constructor(private readonly ticketTitleService: TicketTitleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket title' })
  @ApiBody({ description: 'Ticket title data', type: CreateTicketTitleDto })
  @ApiResponse({ status: 201, description: 'Ticket title created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTicketTitleDto: CreateTicketTitleDto) {
    return await this.ticketTitleService.create(createTicketTitleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all ticket titles with optional pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip (pagination)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Maximum number of records to return' })@ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description',
  })
  @ApiResponse({ status: 200, description: 'List of ticket titles retrieved successfully' })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.ticketTitleService.findAll(skip, take, filter);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Retrieve a specific ticket title by category' })
  @ApiParam({ name: 'categoryId', description: 'Ticket title categoryId', type: String })
  @ApiResponse({ status: 200, description: 'Ticket title retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket title not found' })
  async findByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return await this.ticketTitleService.findByCategory(categoryId);
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket title by ID' })
  @ApiParam({ name: 'id', description: 'Ticket title ID', type: String })
  @ApiResponse({ status: 200, description: 'Ticket title retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket title not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTitleService.findOne(id);
  }

  

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket title by ID' })
  @ApiParam({ name: 'id', description: 'Ticket title ID', type: String })
  @ApiBody({ description: 'Ticket title update data', type: UpdateTicketTitleDto })
  @ApiResponse({ status: 200, description: 'Ticket title updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket title not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTicketTitleDto: UpdateTicketTitleDto) {
    return await this.ticketTitleService.update(id, updateTicketTitleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket title by ID' })
  @ApiParam({ name: 'id', description: 'Ticket title ID', type: String })
  @ApiResponse({ status: 200, description: 'Ticket title deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket title not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTitleService.remove(id);
  }
}
