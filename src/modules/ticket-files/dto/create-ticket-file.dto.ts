import { IsString, IsUUID, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class createTicketFileDTO {
  @ApiProperty({
    description: 'Nombre original del archivo',
    type: String,
    example: 'informe_final.pdf',
    required: true,
  })
  @IsString({ message: 'file_name debe ser un string.' })
  fileName: string;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    type: String,
    example: 'application/pdf',
    required: true,
  })
  @IsString({ message: 'file_type debe ser un string.' })
  fileType: string;

  @ApiProperty({
    description: 'Extensión del archivo',
    type: String,
    example: 'pdf',
    required: true,
  })
  @IsString({ message: 'file_extension debe ser un string.' })
  fileExtension: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    type: Number,
    example: 204800,
    required: true,
  })
  @IsNumber({}, { message: 'file_size debe ser un número.' })
  @IsPositive({ message: 'file_size debe ser mayor que 0.' })
  fileSize: number;

  @ApiPropertyOptional({
    description: 'Descripción opcional del documento',
    type: String,
    example: 'Acta firmada del comité de seguridad',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;
}
