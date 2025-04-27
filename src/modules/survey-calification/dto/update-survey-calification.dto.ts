import { PartialType } from '@nestjs/swagger';
import { CreateSurveyCalificationDto } from './create-survey-calification.dto';

export class UpdateSurveyCalificationDto extends PartialType(CreateSurveyCalificationDto) {}
