import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SurveyCalificationService } from 'src/modules/survey-calification/survey-calification.service';
import { CreateSurveyCalificationDto } from 'src/modules/survey-calification/dto/create-survey-calification.dto';
import { UpdateSurveyCalificationDto } from 'src/modules/survey-calification/dto/update-survey-calification.dto';
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

@ApiTags('SurveyCalifications')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('surveyCalification')
export class SurveyCalificationController {
  constructor(
    private readonly surveyCalificationService: SurveyCalificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new survey rating' })
  @ApiBody({
    description: 'Data required to create a survey rating',
    type: CreateSurveyCalificationDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey rating successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createSurveyCalificationDto: CreateSurveyCalificationDto) {
    return this.surveyCalificationService.create(createSurveyCalificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all survey ratings' })
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
    description: 'Survey ratings successfully retrieved',
  })
  findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return this.surveyCalificationService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific survey rating' })
  @ApiParam({ name: 'id', description: 'ID of the survey rating' })
  @ApiResponse({
    status: 200,
    description: 'Survey rating successfully retrieved',
  })
  @ApiResponse({ status: 404, description: 'Survey rating not found' })
  findOne(@Param('id') id: string) {
    return this.surveyCalificationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a survey rating' })
  @ApiParam({ name: 'id', description: 'ID of the survey rating to update' })
  @ApiBody({
    description: 'Updated data for the survey rating',
    type: UpdateSurveyCalificationDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey rating successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Survey rating not found' })
  update(
    @Param('id') id: string,
    @Body() updateSurveyCalificationDto: UpdateSurveyCalificationDto,
  ) {
    return this.surveyCalificationService.update(
      id,
      updateSurveyCalificationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a survey rating' })
  @ApiParam({ name: 'id', description: 'ID of the survey rating to delete' })
  @ApiResponse({
    status: 200,
    description: 'Survey rating successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Survey rating not found' })
  remove(@Param('id') id: string) {
    return this.surveyCalificationService.remove(id);
  }
}
