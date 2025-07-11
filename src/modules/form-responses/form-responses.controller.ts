import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FormResponsesService } from './form-responses.service';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('FormResponses')
@ApiBearerAuth('access-token')
@Controller('form-responses')
@UseGuards(AuthzGuard)
export class FormResponsesController {
  constructor(private readonly service: FormResponsesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear respuesta de formulario' })
  @ApiBody({ type: CreateFormResponseDto })
  @ApiResponse({ status: 201, description: 'Respuesta creada correctamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una respuesta para ese formulario y ticket' })
  async create(@Body() dto: CreateFormResponseDto) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar respuestas de formulario con paginación y filtro' })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiQuery({ name: 'filter', required: false, example: 'cliente' })
  @ApiResponse({ status: 200, description: 'Respuestas obtenidas correctamente' })
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
    @Query('filter') filter?: string,
  ) {
    return await this.service.findAll(skip, take, filter);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Obtener respuesta por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Respuesta encontrada' })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada' })
  async findById(@Param('id') id: string) {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar respuesta de formulario' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateFormResponseDto })
  @ApiResponse({ status: 200, description: 'Respuesta actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFormResponseDto,
  ) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar respuesta de formulario' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Respuesta eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
}
