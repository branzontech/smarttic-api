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
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { AssignedUserBranchService } from 'src/modules/assigned-user-branch/assigned-user-branch.service';
import { CreateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/create-assigned-user-branch.dto';
import { UpdateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/update-assigned-user-branch.dto';

@ApiBearerAuth('access-token')
@Controller('assignedUserBranch')
@UseGuards(AuthzGuard)
export class AssignedUserBranchController {
  constructor(
    private readonly assignedUserBranchService: AssignedUserBranchService,
  ) {}

  @Post()
  async create(
    @Body() createAssignedUserBranchDto: CreateAssignedUserBranchDto,
  ) {
    return await this.assignedUserBranchService.create(
      createAssignedUserBranchDto,
    );
  }

  @Get()
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
  async findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return await this.assignedUserBranchService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.assignedUserBranchService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssignedUserBranchDto: UpdateAssignedUserBranchDto,
  ) {
    return await this.assignedUserBranchService.update(
      id,
      updateAssignedUserBranchDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.assignedUserBranchService.remove(id);
  }
}
