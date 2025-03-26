import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiBearerAuth('access-token')
@Controller('audits')
@UseGuards(AuthzGuard)
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post()
  async create(@Body() createAuditDto: CreateAuditDto) {
    return await this.auditsService.create(createAuditDto);
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
    return await this.auditsService.findAll(Number(skip), Number(take));
  }

  @Get(':userId')
  async findById(@Param('userId') userId: string) {
    return await this.auditsService.findByUserId(userId);
  }
}
