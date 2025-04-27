import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';
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

@ApiBearerAuth('access-token')
@ApiTags('Audits')
@Controller('audits')
@UseGuards(AuthzGuard)
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create audit record',
    description: 'Creates a new audit record in the system.',
  })
  @ApiBody({
    description: 'Create a new audit record',
    type: CreateAuditDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Audit record created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createAuditDto: CreateAuditDto) {
    return await this.auditsService.create(createAuditDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all audit records',
    description: 'Retrieves a paginated list of audit records.',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved audit records.',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string
  ) {
    return await this.auditsService.findAll(skip, take, filter);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get audit records by user',
    description: 'Retrieves audit records for a specific user by their ID.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user whose audit records are to be retrieved',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved audit records for the user.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no audit records available.',
  })
  async findById(@Param('userId') userId: string) {
    return await this.auditsService.findByUserId(userId);
  }
}
