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
import { SurveyResponseService } from 'src/modules/survey-response/survey-response.service';
import { CreateSurveyResponseDto } from 'src/modules/survey-response/dto/create-survey-response.dto';
import { UpdateSurveyResponseDto } from 'src/modules/survey-response/dto/update-survey-response.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiTags('SurveyResponses')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('survey-response')
export class SurveyResponseController {
  constructor(private readonly surveyResponseService: SurveyResponseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new survey response' })
  @ApiBody({
    description: 'Data required to create a survey response',
    type: CreateSurveyResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey response successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createSurveyResponseDto: CreateSurveyResponseDto) {
    return this.surveyResponseService.create(createSurveyResponseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all survey responses' })
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
    description: 'Filter by description and title.',
  })
  @ApiResponse({
    status: 200,
    description: 'Survey responses successfully retrieved',
  })
  findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return this.surveyResponseService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific survey response' })
  @ApiParam({ name: 'id', description: 'ID of the survey response' })
  @ApiResponse({
    status: 200,
    description: 'Survey response successfully retrieved',
  })
  @ApiResponse({ status: 404, description: 'Survey response not found' })
  findOne(@Param('id') id: string) {
    return this.surveyResponseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a survey response' })
  @ApiParam({ name: 'id', description: 'ID of the survey response to update' })
  @ApiBody({
    description: 'Updated data for the survey response',
    type: UpdateSurveyResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey response successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Survey response not found' })
  update(
    @Param('id') id: string,
    @Body() updateSurveyResponseDto: UpdateSurveyResponseDto,
  ) {
    return this.surveyResponseService.update(id, updateSurveyResponseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a survey response' })
  @ApiParam({ name: 'id', description: 'ID of the survey response to delete' })
  @ApiResponse({
    status: 200,
    description: 'Survey response successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Survey response not found' })
  remove(@Param('id') id: string) {
    return this.surveyResponseService.remove(id);
  }
}
