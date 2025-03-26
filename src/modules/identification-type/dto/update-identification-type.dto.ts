import { PartialType } from '@nestjs/mapped-types';
import { CreateIdentificationTypeDto } from './create-identification-type.dto';

export class UpdateIdentificationTypeDto extends PartialType(CreateIdentificationTypeDto) {}
