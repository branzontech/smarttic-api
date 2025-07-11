import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { CreateFormResponseFileDto } from './dto/create-form-response-file.dto';
import { FormResponseFilesService } from './form-response-files.service';
import { join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@ApiTags('FormResponseFiles')
@ApiBearerAuth('access-token')
@Controller('formResponseFiles')
// @UseGuards(AuthzGuard)
export class FormResponseFilesController {
  constructor(
    private readonly formResponseFilesService: FormResponseFilesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear archivo de una respuesta de formulario',
    description:
      'Este endpoint guarda metadatos de un archivo cargado asociado a una respuesta de formulario.',
  })
  @ApiBody({
    description: 'Datos del archivo',
    type: CreateFormResponseFileDto,
  })
  @ApiResponse({ status: 201, description: 'Archivo guardado correctamente' })
  @ApiResponse({
    status: 409,
    description: 'El archivo ya existe para el campo',
  })
  async create(@Body() dto: CreateFormResponseFileDto) {
    return await this.formResponseFilesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener archivos paginados',
    description:
      'Devuelve una lista paginada de archivos cargados asociados a respuestas de formularios.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    example: 0,
    description: 'Número de registros a omitir (paginación)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    example: 10,
    description: 'Número máximo de registros a devolver',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filtro por nombre de archivo o campo',
  })
  @ApiResponse({ status: 200, description: 'Archivos obtenidos correctamente' })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 100,
    @Query('filter') filter?: string,
  ) {
    return await this.formResponseFilesService.findAll(skip, take, filter);
  }
 

  @Get('download/:filename')
  @ApiOperation({ summary: 'Descargar o visualizar archivo cargado' })
  @ApiParam({
    name: 'filename',
    type: String,
    description: 'Nombre del archivo a descargar',
  })
  @ApiResponse({ status: 200, description: 'Archivo descargado correctamente' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(__dirname, '..', '..', '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.download(filePath);
  }

  @Get('view/:filename')
  @ApiOperation({ summary: 'Ver o descargar archivo asociado a una respuesta' })
  @ApiParam({ name: 'filename', type: String, description: 'Nombre del archivo' })
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '..', '..', '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Solo visualiza en el navegador
    return res.sendFile(filePath);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener archivo por ID',
    description:
      'Devuelve los metadatos de un archivo cargado usando su ID único.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del archivo',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Archivo obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async findById(@Param('id') id: string) {
    return await this.formResponseFilesService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar archivo por ID',
    description:
      'Este endpoint elimina lógicamente un archivo guardado asociado a una respuesta de formulario.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del archivo',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Archivo eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async remove(@Param('id') id: string) {
    return await this.formResponseFilesService.remove(id);
  }
}
