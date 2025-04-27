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
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { AssignedUserBranchService } from 'src/modules/assigned-user-branch/assigned-user-branch.service';
import { CreateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/create-assigned-user-branch.dto';
import { UpdateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/update-assigned-user-branch.dto';

@ApiTags('Assigned User Branches')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('assignedUserBranches')
export class AssignedUserBranchController {
  constructor(
    private readonly assignedUserBranchService: AssignedUserBranchService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assigned user branch' })
  @ApiBody({ type: CreateAssignedUserBranchDto })
  @ApiResponse({ status: 201, description: 'Assigned user branch created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createAssignedUserBranchDto: CreateAssignedUserBranchDto) {
    return this.assignedUserBranchService.create(createAssignedUserBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assigned user branches with pagination' })
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
    description: 'Filter by description and name.',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved assigned user branches.' })
  findAll(@Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
      @Query('take', new ParseIntPipe({ optional: true })) take = 100,
      @Query('filter') filter?: string) {
    return this.assignedUserBranchService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned user branch by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the assigned user branch.' })
  @ApiResponse({ status: 404, description: 'Assigned user branch not found.' })
  async findOne(@Param('id') id: string) {
    const branch = await this.assignedUserBranchService.findById(id);
    if (!branch) {
      throw new NotFoundException(`Assigned user branch with ID ${id} not found`);
    }
    return branch;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assigned user branch details' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateAssignedUserBranchDto })
  @ApiResponse({ status: 200, description: 'Successfully updated assigned user branch.' })
  @ApiResponse({ status: 404, description: 'Assigned user branch not found.' })
  async update(@Param('id') id: string, @Body() updateAssignedUserBranchDto: UpdateAssignedUserBranchDto) {
    const updatedBranch = await this.assignedUserBranchService.update(id, updateAssignedUserBranchDto);
    if (!updatedBranch) {
      throw new NotFoundException(`Assigned user branch with ID ${id} not found`);
    }
    return updatedBranch;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned user branch by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Successfully deleted assigned user branch.' })
  @ApiResponse({ status: 404, description: 'Assigned user branch not found.' })
  async remove(@Param('id') id: string) {
   return await this.assignedUserBranchService.remove(id);    
  }
}
