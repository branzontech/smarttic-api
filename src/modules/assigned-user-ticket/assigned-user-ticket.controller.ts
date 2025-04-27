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
import { AuthzGuard } from '../../common/guards/authz/authz.guard';
import { AssignedUserTicketService } from './assigned-user-ticket.service';
import { CreateAssignedUserTicketDto } from './dto/create-assigned-user-ticket.dto';
import { UpdateAssignedUserTicketDto } from './dto/update-assigned-user-ticket.dto';

@ApiTags('Assigned User Tickets')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('assignedUserTickets')
export class AssignedUserTicketController {
  constructor(
    private readonly assignedUserTicketService: AssignedUserTicketService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assigned user ticket' })
  @ApiBody({ type: CreateAssignedUserTicketDto })
  @ApiResponse({ status: 201, description: 'Assigned user ticket created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createAssignedUserTicketDto: CreateAssignedUserTicketDto) {
    return this.assignedUserTicketService.create(createAssignedUserTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assigned user tickets with pagination' })
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
    description: 'Filter by user name, email or ticket title.',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved assigned user tickets.' })
  findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string
  ) {
    return this.assignedUserTicketService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned user ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the assigned user ticket.' })
  @ApiResponse({ status: 404, description: 'Assigned user ticket not found.' })
  async findOne(@Param('id') id: string) {
    const assignment = await this.assignedUserTicketService.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Assigned user ticket with ID ${id} not found`);
    }
    return assignment;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assigned user ticket details' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateAssignedUserTicketDto })
  @ApiResponse({ status: 200, description: 'Successfully updated assigned user ticket.' })
  @ApiResponse({ status: 404, description: 'Assigned user ticket not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateAssignedUserTicketDto: UpdateAssignedUserTicketDto
  ) {
    const updatedAssignment = await this.assignedUserTicketService.update(id, updateAssignedUserTicketDto);
    if (!updatedAssignment) {
      throw new NotFoundException(`Assigned user ticket with ID ${id} not found`);
    }
    return updatedAssignment;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned user ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Successfully deleted assigned user ticket.' })
  @ApiResponse({ status: 404, description: 'Assigned user ticket not found.' })
  async remove(@Param('id') id: string) {
    return await this.assignedUserTicketService.remove(id);
  }
}