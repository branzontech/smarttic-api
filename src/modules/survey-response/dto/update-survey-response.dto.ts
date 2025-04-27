import { PartialType } from '@nestjs/swagger';
import { CreateSurveyResponseDto } from './create-survey-response.dto';

export class UpdateSurveyResponseDto extends PartialType(CreateSurveyResponseDto) {}
