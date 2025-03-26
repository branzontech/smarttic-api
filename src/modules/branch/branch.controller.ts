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
import { BranchService } from 'src/modules/branch/branch.service';
import { CreateBranchDto } from 'src/modules/branch/dto/create-branch.dto';
import { UpdateBranchDto } from 'src/modules/branch/dto/update-branch.dto';

@ApiBearerAuth('access-token')
@Controller('branch')
@UseGuards(AuthzGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  async create(@Body() createBranchDto: CreateBranchDto) {
    return await this.branchService.create(createBranchDto);
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
    return await this.branchService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.branchService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return await this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.branchService.remove(id);
  }
}
