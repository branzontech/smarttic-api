import { ApiProperty } from '@nestjs/swagger';

export class CreateFormResponseFileDto {
  @ApiProperty()
  formResponseId: string;

  @ApiProperty()
  fieldKey: string;
}
