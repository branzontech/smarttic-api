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
  ParseArrayPipe,
  BadRequestException,
} from '@nestjs/common';
import { LaborHoursService } from './labor-hours.service';
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
import { CreateLaborHourDto } from './dto/create-labor-hours.dto';
import { UpdateLaborHourDto } from './dto/update-labor-hours.dot';
import { DeactivateGroupDto } from './dto/deactivate-group.dto';

@ApiTags('LaborHours')
@ApiBearerAuth('access-token')
@Controller('labor-hours')
@UseGuards(AuthzGuard)
export class LaborHoursController {
  constructor(private readonly service: LaborHoursService) {}

  @Post()
  @ApiOperation({ summary: 'Crear horario laboral' })
  @ApiBody({ type: [CreateLaborHourDto] })
  @ApiResponse({ status: 201, description: 'Horario creado correctamente' })
  async create(@Body() dto: CreateLaborHourDto[]) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar horarios laborales' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'dayOfWeek', required: false })
  @ApiResponse({ status: 200, description: 'Horarios obtenidos correctamente' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('dayOfWeek') dayOfWeek?: number,
  ) {
    return await this.service.findAll({ branchId, dayOfWeek });
  }

  @Get('by-branches')
  @ApiOperation({ summary: 'Obtener horarios laborales por sucursales' })
  @ApiQuery({
    name: 'branchIds',
    type: [String],
    required: true,
    isArray: true,
  })
  async findByBranchIds(
    @Query('branchIds', new ParseArrayPipe({ items: String, separator: ',' }))
    branchIds: string[],
  ) {
    return await this.service.findByBranchIds(branchIds);
  }

  @Get('by-ids')
  @ApiOperation({ summary: 'Obtener horarios laborales por IDs' })
  @ApiQuery({
    name: 'scheduleIds',
    type: [String],
    required: true,
    isArray: true,
  })
  async findByIds(
    @Query('scheduleIds', new ParseArrayPipe({ items: String, separator: ',' }))
    scheduleIds: string[],
  ) {
    return {
      status: true,
      resultData: await this.service.findByIds(scheduleIds),
    };
  }

  @Patch('desactivate-schedule')
  @ApiOperation({ summary: 'Desactivar grupo de horarios' })
  @ApiBody({ type: DeactivateGroupDto })
  @ApiResponse({ status: 200, description: 'Grupo de horarios desactivado' })
  async deactivateGroup(@Body() body: DeactivateGroupDto) {
    if (body.branchIds?.length) {
      return await this.service.desactivateGroupByBranches(body.branchIds);
    } else if (body.scheduleIds?.length) {
      return await this.service.desactivateGroupByScheduleIds(body.scheduleIds);
    } else {
      throw new BadRequestException('Debes enviar branchIds o scheduleIds');
    }
  }

  @Patch('activate-schedule')
  @ApiOperation({ summary: 'Activar grupo de horarios' })
  @ApiBody({ type: [String] })
  @ApiResponse({ status: 200, description: 'Grupo de horarios activado' })
  async activateGroup(@Body() body: { scheduleIds: string[] }) {
    return await this.service.activateSchedule(body.scheduleIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener horario laboral por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Horario encontrado' })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  async findById(@Param('id') id: string) {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar horario laboral' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLaborHourDto })
  @ApiResponse({
    status: 200,
    description: 'Horario actualizado correctamente',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateLaborHourDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar horario laboral' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Horario eliminado correctamente' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
}
