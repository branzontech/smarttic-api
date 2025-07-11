import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ResponseErrorInterceptor } from '../form-fields/interceptors/response_error.interceptor';

@ApiTags('Forms')
@ApiBearerAuth('access-token')
@UseInterceptors(ResponseErrorInterceptor)
@Controller('forms')
@UseGuards(AuthzGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo formulario',
    description: 'Crea un nuevo formulario con campos y categorías (si aplica).',
  })
  @ApiBody({ type: CreateFormDto })
  @ApiResponse({ status: 201, description: 'Formulario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createFormDto: CreateFormDto) {
    return await this.formsService.create(createFormDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar formularios',
    description: 'Obtiene todos los formularios con paginación, filtros y si son templates.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiQuery({ name: 'filter', required: false, type: String })
  @ApiQuery({ name: 'isTemplate', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Formularios obtenidos correctamente' })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 10,
    @Query('filter') filter?: string,
    @Query('isTemplate') isTemplate?: boolean,
  ) {
    return await this.formsService.findAll(skip, take, filter, isTemplate);
  }

  @Get('titleId/:titleId')
  @ApiOperation({
    summary: 'Obtener formulario por ID de título',
    description: 'Recupera un formulario completo con sus campos y títulos relacionados, ordenados por el campo order.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID del título asociado al formulario',
    example: '5f8d8f9d8f9d8f9d8f9d8f9d',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Formulario encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulario no encontrado para la título especificada',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async findByTitleId(@Param('titleId') titleId: string) {
    return await this.formsService.findByTitleId(titleId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener formulario por ID',
    description: 'Devuelve un formulario con sus campos y titulos si existe.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Formulario obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Formulario no encontrado' })
  async findById(@Param('id') id: string) {
    return await this.formsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar formulario',
    description: 'Actualiza un formulario por su ID incluyendo campos y categorías.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateFormDto })
  @ApiResponse({ status: 200, description: 'Formulario actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Formulario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ) {
    return await this.formsService.update(id, updateFormDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar formulario',
    description: 'Elimina (soft delete) un formulario si no está asignado a categorías.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Formulario eliminado correctamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar por estar asignado' })
  @ApiResponse({ status: 404, description: 'Formulario no encontrado' })
  async remove(@Param('id') id: string) {
    return await this.formsService.remove(id);
  }

  @Get('template/:templateId/fields')
  @ApiOperation({
    summary: 'Obtener campos de template',
    description: 'Retorna los campos asociados a un formulario template.',
  })
  @ApiParam({ name: 'templateId', type: String })
  @ApiResponse({ status: 200, description: 'Campos del template obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async getTemplateFields(@Param('templateId') templateId: string) {
    return await this.formsService.getTemplateFields(templateId);
  }
}
