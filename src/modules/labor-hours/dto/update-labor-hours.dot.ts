import { PartialType } from '@nestjs/swagger';
import { CreateLaborHourDto } from './create-labor-hours.dto';

export class UpdateLaborHourDto extends PartialType(CreateLaborHourDto) {}
