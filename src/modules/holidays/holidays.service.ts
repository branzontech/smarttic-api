import { In } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { UpdateHolidayDto } from './dto/update-holidays.dto';
import { Holiday } from './entities/holidays.entity';
import { CreateHolidayDto } from './dto/create-holidays.dto';
import colombianHolidays from 'colombian-holidays';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private readonly HolidayRepo: Repository<Holiday>,
  ) {}

  async create(dtos: CreateHolidayDto[]) {
    const validos = dtos.filter((dto) => dto.date && dto.name);

    if (validos.length === 0) {
      throw new BadRequestException('No se proporcionaron feriados válidos.');
    }

    const holidays: DeepPartial<Holiday>[] = validos.map((dto) => ({
      date: dto.date,
      name: dto.name,
      branch_id: dto.branchId,
    }));

    console.log('Holidays:', holidays);

    try {
      const feriados = await this.HolidayRepo.save(
        this.HolidayRepo.create(holidays),
      );

      return {
        status: true,
        message: 'Feriados guardados correctamente',
        resultData: feriados,
      };
    } catch (error) {
      console.error('Error al guardar feriados:', error);
      throw new BadRequestException(
        'Ocurrió un error al guardar los feriados.',
      );
    }
  }

  async importColombianHolidays() {
    const raw = colombianHolidays({ year: new Date().getFullYear() });

    const uniqueDates = raw.map((h) => {
      const dateObj = new Date(h.date);
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getUTCDate()).padStart(2, '0');

      return {
        name: h.name.es,
        date: `${mm}-${dd}`,
        branchId: null,
      };
    });

    const existing = await this.HolidayRepo.find();
    const existingSet = new Set(existing.map((e) => `${e.name}-${e.date}`));

    const nuevos = uniqueDates.filter(
      (h) => !existingSet.has(`${h.name}-${h.date}`),
    );

    if (nuevos.length === 0) {
      throw new BadRequestException(
        'No se encontraron feriados nuevos para importar.',
      );
    }

    return await this.create(nuevos);
  }

  async findAll(filter: { branchId?: string }): Promise<Holiday[]> {
    const where: FindOptionsWhere<Holiday> = {};

    if (filter.branchId) {
      where.branch_id = filter.branchId;
    }

    return await this.HolidayRepo.find({
      where,
      order: {
        date: 'ASC',
      },
      relations: ['branch'],
    });
  }

  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.HolidayRepo.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!holiday) {
      throw new NotFoundException(`No se encontró el feriado con ID ${id}`);
    }

    return holiday;
  }

  async update(id: string, dto: UpdateHolidayDto): Promise<Holiday> {
    const holiday = await this.findOne(id);

    // Mapeo manual de camelCase a snake_case
    const mappedDto = {
      ...(dto.date !== undefined && { date: dto.date }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.branchId !== undefined && { branch_id: dto.branchId }),
    };

    const updatedHoliday = this.HolidayRepo.merge(holiday, mappedDto);
    return await this.HolidayRepo.save(updatedHoliday);
  }

  async remove(ids: string[]): Promise<Holiday[]> {
    const holidays = await this.HolidayRepo.findBy({ id: In(ids) });
    await this.HolidayRepo.remove(holidays);
    return holidays;
  }

  async removeBranchesFromHoliday(
    name: string,
    date: string,
    branchIds: string[],
  ) {
    if (!name || !date || !branchIds?.length) {
      throw new BadRequestException(
        'Faltan datos requeridos para eliminar sucursales del feriado.',
      );
    }

    const holidaysToRemove = await this.HolidayRepo.find({
      where: {
        name,
        date,
        branch_id: In(branchIds),
      },
    });

    if (holidaysToRemove.length === 0) {
      throw new NotFoundException(
        'No se encontraron feriados que coincidan para eliminar.',
      );
    }

    await this.HolidayRepo.remove(holidaysToRemove);

    return {
      status: true,
      message: 'Sucursales eliminadas del feriado correctamente.',
      deletedCount: holidaysToRemove.length,
    };
  }
}
