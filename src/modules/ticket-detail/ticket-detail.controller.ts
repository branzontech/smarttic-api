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
import { TicketDetailService } from './ticket-detail.service';
import { CreateTicketDetailDto } from './dto/create-ticket-detail.dto';
import { UpdateTicketDetailDto } from './dto/update-ticket-detail.dto';
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

@ApiTags('Ticket Details')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('ticketDetail')
export class TicketDetailController {
  constructor(private readonly ticketDetailService: TicketDetailService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket detail' })
  @ApiBody({
    description: 'Create a new ticket detail',
    type: CreateTicketDetailDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket detail created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTicketDetailDto: CreateTicketDetailDto) {
    return await this.ticketDetailService.create(createTicketDetailDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all ticket details with optional pagination',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Maximum number of records to return',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description and prefix.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of ticket details retrieved successfully',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.ticketDetailService.findAll(skip, take, filter);
  }

  @Get('ticketId/:id')
  @ApiOperation({ summary: 'Retrieve a ticket and its details by ticket ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to retrieve along with its details',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket and its details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async findTicketAndDetailsById(@Param('id') id: string) {
    return await this.ticketDetailService.findTicketAndDetailsById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket detail by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket detail to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket detail retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket detail not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketDetailService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket detail by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket detail to update',
    type: String,
  })
  @ApiBody({
    description: 'Update ticket detail data',
    type: UpdateTicketDetailDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket detail updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket detail not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDetailDto: UpdateTicketDetailDto,
  ) {
    return await this.ticketDetailService.update(id, updateTicketDetailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket detail by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket detail to delete',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket detail deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket detail not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketDetailService.remove(id);
  }
}
