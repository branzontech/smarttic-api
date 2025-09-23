import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedTicketFile } from './entities/assigned-ticket-file.entity';
import { CreateAssignedTicketFileDto } from './dto/create-assigned-ticket-file.dto';
import { UpdateAssignedTicketFileDto } from './dto/update-assigned-ticket-file.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class AssignedTicketFileService {
  constructor(
    @InjectRepository(AssignedTicketFile)
    private readonly fileRepository: Repository<AssignedTicketFile>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(dto: CreateAssignedTicketFileDto): Promise<AssignedTicketFile> {
    try {
      const existing = await this.fileRepository.findOne({
        where: {
          ticketId: dto.ticketId,
          fileId: dto.fileId,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe un archivo asignado a este ticket con el mismo fileId.`,
        );
      }

      const assignedFile = this.fileRepository.create(dto);
      const saved = await this.fileRepository.save(assignedFile);

      await this.cacheManager.delCache(`assignedTicketFiles:*`);
      return saved;
    } catch (error) {
      console.error('Error al asignar archivo a ticket:', error.message);
      throw new InternalServerErrorException(
        'Error al asignar el archivo al ticket',
      );
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    const cacheKey = `assignedTicketFiles:skip:${skip}:take:${take}:filter:${filter || ''}`;
    const cached = await this.cacheManager.getCache(cacheKey);
    if (cached) return cached;

    const query = this.fileRepository
      .createQueryBuilder('assignedFile')
      .leftJoinAndSelect('assignedFile.ticket', 'ticket')
      .leftJoinAndSelect('assignedFile.file', 'file');

    if (filter) {
      query.where('file.file_name ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }

    query.orderBy('assignedFile.ticketId', 'DESC').skip(skip).take(take);

    const [data, total] = await query.getManyAndCount();
    const result = { data, total };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findByIds(ticketId: string, fileId: string): Promise<AssignedTicketFile> {
    const cacheKey = `assignedTicketFile:${ticketId}:${fileId}`;
    const cached = await this.cacheManager.getCache<AssignedTicketFile>(cacheKey);
    if (cached) return cached;

    const assignedFile = await this.fileRepository.findOne({
      where: { ticketId, fileId },
      relations: ['ticket', 'file'],
    });

    if (!assignedFile) {
      throw new NotFoundException(
        `No se encontró relación entre ticket ${ticketId} y archivo ${fileId}`,
      );
    }

    await this.cacheManager.setCache(cacheKey, assignedFile, CACHE_TTL);
    return assignedFile;
  }

  async update(
    ticketId: string,
    fileId: string,
    dto: UpdateAssignedTicketFileDto,
  ): Promise<AssignedTicketFile> {
    try {
      const assignedFile = await this.findByIds(ticketId, fileId);

      Object.assign(assignedFile, dto);
      const updated = await this.fileRepository.save(assignedFile);

      await this.cacheManager.delCache(`assignedTicketFile:${ticketId}:${fileId}`);
      await this.cacheManager.delCache(`assignedTicketFiles:*`);
      return updated;
    } catch (error) {
      console.error('Error al actualizar relación ticket-archivo:', error.message);
      throw new InternalServerErrorException('Error al actualizar asignación');
    }
  }

  async remove(ticketId: string, fileId: string): Promise<void> {
    try {
      const assignedFile = await this.fileRepository.findOne({
        where: { ticketId, fileId },
      });

      if (!assignedFile) {
        throw new NotFoundException(
          `No se encontró relación entre ticket ${ticketId} y archivo ${fileId}`,
        );
      }

      await this.fileRepository.remove(assignedFile);
      await this.cacheManager.delCache(`assignedTicketFile:${ticketId}:${fileId}`);
      await this.cacheManager.delCache(`assignedTicketFiles:*`);
    } catch (error) {
      console.error('Error al eliminar relación ticket-archivo:', error.message);
      throw new InternalServerErrorException(
        `Error al eliminar asignación de ticket-archivo`,
      );
    }
  }
}
