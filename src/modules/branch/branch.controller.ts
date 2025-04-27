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
import { BranchService } from 'src/modules/branch/branch.service';
import { CreateBranchDto } from 'src/modules/branch/dto/create-branch.dto';
import { UpdateBranchDto } from 'src/modules/branch/dto/update-branch.dto';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@Controller('branch')
@UseGuards(AuthzGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @ApiOperation({
    summary: 'Create branch',
    description: 'Creates a new branch in the system.',
  })
  @ApiBody({
    description: 'Create a new branch',
    type: CreateBranchDto,
  })
  @ApiResponse({ status: 201, description: 'Branch successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createBranchDto: CreateBranchDto) {
    return await this.branchService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all branches',
    description: 'Retrieves a paginated list of all branches.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description:
      'The number of records to skip before starting to return results. Use this for pagination.',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description:
      'The maximum number of records to return in a single request. Use this to control response size.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description and name.',
  })
  @ApiResponse({
    status: 201,
    description: 'List of branches retrieved successfully.',
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.branchService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get branch by ID',
    description: 'Retrieves details of a specific branch by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the branch to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Branch details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async findById(@Param('id') id: string) {
    return await this.branchService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update branch',
    description: 'Updates the details of an existing branch.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the branch to update',
    type: String,
  })
  @ApiBody({
    description: 'Update branch details',
    type: UpdateBranchDto,
  })
  @ApiResponse({ status: 200, description: 'Branch successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return await this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete branch',
    description: 'Deletes a branch from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the branch to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Branch successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async remove(@Param('id') id: string) {
    return await this.branchService.remove(id);
  }
}
