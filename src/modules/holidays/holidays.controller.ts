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
import { HolidaysService } from './holidays.service';
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
import { CreateHolidayDto } from './dto/create-holidays.dto';
import { UpdateHolidayDto } from './dto/update-holidays.dto';

@ApiTags('Holidays')
@ApiBearerAuth('access-token')
@Controller('holidays')
@UseGuards(AuthzGuard)
export class HolidaysController {
  constructor(private readonly service: HolidaysService) {}

  @Post()
  @ApiOperation({ summary: 'Crear feriado' })
  @ApiBody({ type: [CreateHolidayDto] })
  @ApiResponse({ status: 201, description: 'Feriado creado correctamente' })
  async create(@Body() dto: CreateHolidayDto[]) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar feriados' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Feriados obtenidos correctamente' })
  async findAll(@Query('branchId') branchId?: string) {
    return await this.service.findAll({ branchId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener feriado' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiResponse({ status: 200, description: 'Feriado obtenido correctamente' })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar feriado' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiBody({ type: UpdateHolidayDto })
  @ApiResponse({
    status: 200,
    description: 'Feriado actualizado correctamente',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return await this.service.update(id, dto);
  }

  @Delete('by-branches')
  @ApiOperation({ summary: 'Eliminar sucursales de un feriado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        date: { type: 'string', format: 'date' },
        branchIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['name', 'date', 'branchIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sucursales eliminadas del feriado correctamente',
  })
  async removeBranches(
    @Body() body: { name: string; date: string; branchIds: string[] },
  ) {
    const { name, date, branchIds } = body;
    return await this.service.removeBranchesFromHoliday(name, date, branchIds);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Eliminar feriado' })
  @ApiResponse({ status: 200, description: 'Feriado eliminado correctamente' })
  async remove(@Body() ids: string[]) {
    return await this.service.remove(ids);
  }

  @Post('import-colombia')
  @ApiOperation({ summary: 'Importar feriados colombianos' })
  @ApiResponse({
    status: 201,
    description: 'Feriados colombianos importados correctamente',
  })
  async importColombia() {
    return await this.service.importColombianHolidays();
  }
}
