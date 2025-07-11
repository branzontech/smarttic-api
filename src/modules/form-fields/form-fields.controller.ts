import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FormFieldsService } from './form-fields.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('FormFields')
@ApiBearerAuth('access-token')
@Controller('formFields')
@UseGuards(AuthzGuard)
export class FormFieldsController {
  constructor(private readonly formFieldsService: FormFieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear campo de formulario' })
  @ApiBody({ type: CreateFormFieldDto })
  @ApiResponse({ status: 201, description: 'Campo creado correctamente' })
  async create(@Body() createDto: CreateFormFieldDto) {
    return await this.formFieldsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los campos de formulario' })
  @ApiResponse({ status: 200, description: 'Campos obtenidos correctamente' })
  async findAll() {
    return await this.formFieldsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener campo de formulario por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Campo encontrado correctamente' })
  @ApiResponse({ status: 404, description: 'Campo no encontrado' })
  async findById(@Param('id') id: string) {
    return await this.formFieldsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campo de formulario' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateFormFieldDto })
  @ApiResponse({ status: 200, description: 'Campo actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Campo no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFormFieldDto,
  ) {
    return await this.formFieldsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar campo de formulario' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Campo eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Campo no encontrado' })
  async remove(@Param('id') id: string) {
    return await this.formFieldsService.remove(id);
  }
}
