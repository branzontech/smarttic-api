import { PartialType } from '@nestjs/swagger';
import { CreateFormResponseDto } from './create-form-response.dto';

export class UpdateFormResponseDto extends PartialType(CreateFormResponseDto) {}
