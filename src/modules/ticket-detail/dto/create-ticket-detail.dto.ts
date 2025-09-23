import {
  IsString,
  IsBoolean,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FileInfoDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  fileExtension: string;
}
export class CreateTicketDetailDto {
  @ApiPropertyOptional({
    description: 'Descripción del detalle del ticket',
    type: String,
    example: 'Se intentó reiniciar la contraseña sin éxito.',
  })
  @IsString({ message: 'description debe ser un string.' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID del usuario que agrega el detalle',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID('4', { message: 'userId debe ser un UUID válido.' })
  userId: string;

  @ApiProperty({
    description: 'ID del ticket al que pertenece el detalle',
    type: String,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID('4', { message: 'ticketId debe ser un UUID válido.' })
  ticketId: string;

  @ApiPropertyOptional({
    description: 'Estado del detalle del ticket',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'state debe ser un valor booleano.' })
  @IsOptional()
  state?: boolean;

  @ApiPropertyOptional({
    description:
      'Archivos adjuntos relacionados con el detalle del ticket. Cada archivo debe contener nombre, tipo MIME, tamaño en bytes y extensión.',
    type: [FileInfoDto],
    example: [
      {
        fileName: 'captura-error.png',
        fileType: 'image/png',
        fileSize: 204800,
        fileExtension: '.png',
      },
      {
        fileName: 'reporte.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576,
        fileExtension: '.pdf',
      },
    ],
  })
  @IsOptional()
  infoFiles?: FileInfoDto[];
}
