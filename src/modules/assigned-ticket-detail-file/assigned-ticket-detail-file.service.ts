import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedTicketDetailFile } from './entities/assigned-ticket-detail-file.entity';
import { CreateAssignedTicketDetailFileDto } from './dto/create-assigned-ticket-detail-file.dto';
import { UpdateAssignedTicketDetailFileDto } from './dto/update-assigned-ticket-detail-file.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class AssignedTicketDetailFileService {
  constructor(
    @InjectRepository(AssignedTicketDetailFile)
    private readonly fileRepository: Repository<AssignedTicketDetailFile>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    dto: CreateAssignedTicketDetailFileDto,
  ): Promise<AssignedTicketDetailFile> {
    try {
      const existing = await this.fileRepository.findOne({
        where: {
          ticketDetailId: dto.ticketDetailId,
          fileId: dto.fileId,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe un archivo asignado a este detalle de ticket con el mismo fileId.`,
        );
      }

      const assignedDetailFile = this.fileRepository.create(dto);
      const saved = await this.fileRepository.save(assignedDetailFile);

      await this.cacheManager.delCache(`assignedTicketDetailFiles:*`);
      return saved;
    } catch (error) {
      console.error(
        'Error al asignar archivo a detalle de ticket:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Error al asignar el archivo al detalle del ticket',
      );
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    const cacheKey = `assignedTicketDetailFiles:skip:${skip}:take:${take}:filter:${
      filter || ''
    }`;
    const cached = await this.cacheManager.getCache(cacheKey);
    if (cached) return cached;

    const query = this.fileRepository
      .createQueryBuilder('assignedDetailFile')
      .leftJoinAndSelect('assignedDetailFile.ticketDetail', 'ticketDetail')
      .leftJoinAndSelect('assignedDetailFile.file', 'file');

    if (filter) {
      query.where('file.file_name ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }

    query
      .orderBy('assignedDetailFile.ticketDetailId', 'DESC')
      .skip(skip)
      .take(take);

    const [data, total] = await query.getManyAndCount();
    const result = { data, total };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findByIds(
    ticketDetailId: string,
    fileId: string,
  ): Promise<AssignedTicketDetailFile> {
    const cacheKey = `assignedTicketDetailFile:${ticketDetailId}:${fileId}`;
    const cached =
      await this.cacheManager.getCache<AssignedTicketDetailFile>(cacheKey);
    if (cached) return cached;

    const assignedDetailFile = await this.fileRepository.findOne({
      where: { ticketDetailId, fileId },
      relations: ['ticketDetail', 'file'],
    });

    if (!assignedDetailFile) {
      throw new NotFoundException(
        `No se encontró relación entre detalle de ticket ${ticketDetailId} y archivo ${fileId}`,
      );
    }

    await this.cacheManager.setCache(cacheKey, assignedDetailFile, CACHE_TTL);
    return assignedDetailFile;
  }

  async update(
    ticketDetailId: string,
    fileId: string,
    dto: UpdateAssignedTicketDetailFileDto,
  ): Promise<AssignedTicketDetailFile> {
    try {
      const assignedDetailFile = await this.findByIds(ticketDetailId, fileId);

      Object.assign(assignedDetailFile, dto);
      const updated = await this.fileRepository.save(assignedDetailFile);

      await this.cacheManager.delCache(
        `assignedTicketDetailFile:${ticketDetailId}:${fileId}`,
      );
      await this.cacheManager.delCache(`assignedTicketDetailFiles:*`);
      return updated;
    } catch (error) {
      console.error(
        'Error al actualizar relación detalleTicket-archivo:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Error al actualizar asignación detalleTicket-archivo',
      );
    }
  }

  async remove(ticketDetailId: string, fileId: string): Promise<void> {
    try {
      const assignedDetailFile = await this.fileRepository.findOne({
        where: { ticketDetailId, fileId },
      });

      if (!assignedDetailFile) {
        throw new NotFoundException(
          `No se encontró relación entre detalle de ticket ${ticketDetailId} y archivo ${fileId}`,
        );
      }

      await this.fileRepository.remove(assignedDetailFile);
      await this.cacheManager.delCache(
        `assignedTicketDetailFile:${ticketDetailId}:${fileId}`,
      );
      await this.cacheManager.delCache(`assignedTicketDetailFiles:*`);
    } catch (error) {
      console.error(
        'Error al eliminar relación detalleTicket-archivo:',
        error.message,
      );
      throw new InternalServerErrorException(
        `Error al eliminar asignación de detalleTicket-archivo`,
      );
    }
  }
}
