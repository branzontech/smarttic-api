import { PartialType } from '@nestjs/swagger';
import { CreateGeneralParameterDto } from './create-general-parameter.dto';

export class UpdateGeneralParameterDto extends PartialType(CreateGeneralParameterDto) {}
