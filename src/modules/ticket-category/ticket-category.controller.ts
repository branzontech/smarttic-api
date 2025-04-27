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
import { TicketCategoryService } from './ticket-category.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
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

@ApiTags('Ticket Categories')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('ticketCategory')
export class TicketCategoryController {
  constructor(private readonly ticketCategoryService: TicketCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket category' })
  @ApiBody({
    description: 'Create a new ticket category',
    type: CreateTicketCategoryDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTicketCategoryDto: CreateTicketCategoryDto) {
    return await this.ticketCategoryService.create(createTicketCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all ticket categories with optional pagination',
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
    description: 'List of ticket categories retrieved successfully',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.ticketCategoryService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket category by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket category to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket category not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific ticket category by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket category to update',
    type: String,
  })
  @ApiBody({
    description: 'Update ticket category details',
    type: UpdateTicketCategoryDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket category updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketCategoryDto: UpdateTicketCategoryDto,
  ) {
    return await this.ticketCategoryService.update(id, updateTicketCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket category by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket category to delete',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket category deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket category not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketCategoryService.remove(id);
  }
}
