import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DeepPartial, In } from 'typeorm';
import { UpdateLaborHourDto } from './dto/update-labor-hours.dot';
import { LaborHour } from './entities/labor-hours.entity';
import { CreateLaborHourDto } from './dto/create-labor-hours.dto';

@Injectable()
export class LaborHoursService {
  constructor(
    @InjectRepository(LaborHour)
    private readonly LaborHourRepo: Repository<LaborHour>,
  ) {}

  async create(dtos: CreateLaborHourDto[]): Promise<{
    status: boolean;
    message: string;
    resultData: LaborHour[];
  }> {
    const diasActivos = dtos.filter((dto) => dto.isActive);
    if (diasActivos.length === 0) {
      throw new BadRequestException('Debes activar al menos un día laboral.');
    }

    const validos = dtos.filter(
      (dto) => dto.isActive && dto.startTime && dto.endTime,
    );

    const laborHours: DeepPartial<LaborHour>[] = validos.map((dto) => ({
      day_of_week: dto.dayOfWeek,
      start_time: dto.startTime,
      end_time: dto.endTime,
      start_break: dto.startBreak ?? null,
      end_break: dto.endBreak ?? null,
      branch_id: dto.branchId ?? null,
      is_active: dto.isActive ?? true,
      status: 'Activo',
    }));

    try {
      const horarios = await this.LaborHourRepo.save(
        this.LaborHourRepo.create(laborHours),
      );

      return {
        status: true,
        message: 'Horarios Laborales guardados correctamente',
        resultData: horarios,
      };
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      throw new BadRequestException(
        'Ocurrió un error al guardar los horarios.',
      );
    }
  }

  async findAll(filter: {
    branchId?: string;
    dayOfWeek?: number;
  }): Promise<LaborHour[]> {
    const where: FindOptionsWhere<LaborHour> = {};

    if (filter.branchId) {
      where.branch_id = filter.branchId;
    }

    if (filter.dayOfWeek !== undefined) {
      where.day_of_week = filter.dayOfWeek;
    }

    return await this.LaborHourRepo.find({
      where,
      order: {
        day_of_week: 'ASC',
        start_time: 'ASC',
      },
      relations: ['branch'],
    });
  }

  async findById(id: string): Promise<LaborHour> {
    const schedule = await this.LaborHourRepo.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!schedule) {
      throw new NotFoundException(`No se encontró el horario con ID ${id}`);
    }

    return schedule;
  }

  async findByBranchIds(branchIds: string[]): Promise<LaborHour[]> {
    const schedules = await this.LaborHourRepo.find({
      where: {
        branch_id: In(branchIds),
      },

      relations: ['branch'],
      order: {
        day_of_week: 'ASC',
      },
    });

    if (!schedules.length) {
      throw new NotFoundException(
        `No se encontraron horarios para las sucursales proporcionadas.`,
      );
    }

    return schedules;
  }

  async findByIds(scheduleIds: string[]): Promise<LaborHour[]> {
    const schedules = await this.LaborHourRepo.find({
      where: {
        id: In(scheduleIds),
      },
      order: {
        day_of_week: 'ASC',
      },
      relations: ['branch'],
    });

    if (!schedules.length) {
      throw new NotFoundException(
        'No se encontraron horarios por los IDs dados.',
      );
    }

    return schedules;
  }

  async update(id: string, dto: UpdateLaborHourDto): Promise<LaborHour> {
    const schedule = await this.findById(id);

    if (!dto.isActive) {
      await this.LaborHourRepo.remove(schedule);
      console.log('Horario eliminado porque isActive es false');
      return;
    }

    schedule.day_of_week = dto.dayOfWeek;
    schedule.start_time = dto.startTime;
    schedule.end_time = dto.endTime;
    schedule.branch_id = dto.branchId;
    schedule.is_active = dto.isActive;
    schedule.start_break = dto.startBreak;
    schedule.end_break = dto.endBreak;

    return await this.LaborHourRepo.save(schedule);
  }

  async remove(id: string): Promise<{ message: string }> {
    const schedule = await this.findById(id);
    await this.LaborHourRepo.remove(schedule);
    return { message: 'Horario eliminado correctamente' };
  }

  async desactivateGroupByBranches(branchIds: string[]): Promise<{
    status: boolean;
    message: string;
  }> {
    const schedules = await this.LaborHourRepo.find({
      where: { branch_id: In(branchIds) },
      relations: ['branch'],
    });

    if (!schedules.length) {
      throw new NotFoundException('No se encontraron horarios para desactivar');
    }

    const uniqueByDay = new Map<number, boolean>();
    const schedulesToUpdate = [];

    for (const schedule of schedules) {
      if (!uniqueByDay.has(schedule.day_of_week)) {
        uniqueByDay.set(schedule.day_of_week, true);

        schedule.branch_id = null;
        schedule.branch = null;
        schedule.status = 'Inactivo';

        schedulesToUpdate.push(schedule);
      } else {
        await this.LaborHourRepo.remove(schedule);
      }
    }

    await this.LaborHourRepo.save(schedulesToUpdate);

    return {
      status: true,
      message: 'Horarios desactivados correctamente (único por día)',
    };
  }

  async desactivateGroupByScheduleIds(scheduleIds: string[]) {
    const schedules = await this.LaborHourRepo.findBy({ id: In(scheduleIds) });

    if (!schedules.length) {
      throw new NotFoundException('No se encontraron horarios por ID');
    }

    for (const schedule of schedules) {
      schedule.status = 'Inactivo';
    }

    await this.LaborHourRepo.save(schedules);
    return {
      status: true,
      message: 'Horarios desactivados correctamente (por IDs)',
    };
  }

  async activateSchedule(scheduleIds: string[]): Promise<{
    status: boolean;
    message: string;
  }> {
    const schedules = await this.LaborHourRepo.findBy({
      id: In(scheduleIds),
    });

    if (!schedules.length) {
      throw new NotFoundException('No se encontraron horarios para activar');
    }

    for (const schedule of schedules) {
      schedule.status = 'Activo';
    }

    await this.LaborHourRepo.save(schedules);

    return {
      status: true,
      message: 'Horarios activados correctamente',
    };
  }
}
