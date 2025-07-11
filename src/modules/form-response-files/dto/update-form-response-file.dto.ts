import { PartialType } from '@nestjs/swagger';
import { CreateFormResponseFileDto } from './create-form-response-file.dto';

export class UpdateFormResponseFileDto extends PartialType(CreateFormResponseFileDto) {}
