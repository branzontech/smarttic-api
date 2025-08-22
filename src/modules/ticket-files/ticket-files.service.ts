import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketFile } from './entities/ticket-file.entity';
import { createTicketFileDTO } from './dto/create-ticket-file.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class TicketFilesService {
  constructor(
    @InjectRepository(TicketFile)
    private readonly fileRepository: Repository<TicketFile>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(dto: createTicketFileDTO): Promise<TicketFile> {
    try {
      // Verificar si ya existe un archivo con mismo nombre y tamaño
      const existing = await this.fileRepository.findOne({
        where: {
          fileName: dto.fileName,
          fileSize: dto.fileSize,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe un archivo con el mismo nombre y tamaño.`,
        );
      }

      const file = this.fileRepository.create(dto);
      const saved = await this.fileRepository.save(file);

      await this.cacheManager.delCache(`ticketFiles:*`);
      return saved;
    } catch (error) {
      console.error('Error al crear archivo de ticket:', error.message);
      throw new InternalServerErrorException('Error al crear archivo');
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    const cacheKey = `ticketFiles:skip:${skip}:take:${take}:filter:${
      filter || ''
    }`;
    const cached = await this.cacheManager.getCache(cacheKey);
    if (cached) return cached;

    const query = this.fileRepository.createQueryBuilder('file');

    if (filter) {
      query.where('file.fileName ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }

    query.orderBy('file.createdAt', 'DESC').skip(skip).take(take);

    const [data, total] = await query.getManyAndCount();
    const result = { data, total };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findOne(id: string): Promise<TicketFile> {
    const cacheKey = `ticketFile:${id}`;
    const cached = await this.cacheManager.getCache<TicketFile>(cacheKey);
    if (cached) return cached;

    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException(`Archivo con id ${id} no encontrado`);
    }

    await this.cacheManager.setCache(cacheKey, file, CACHE_TTL);
    return file;
  }

  async update(id: string, dto: Partial<createTicketFileDTO>): Promise<TicketFile> {
    try {
      const file = await this.findOne(id);

      Object.assign(file, dto);
      const updated = await this.fileRepository.save(file);

      await this.cacheManager.delCache(`ticketFile:${id}`);
      await this.cacheManager.delCache(`ticketFiles:*`);
      return updated;
    } catch (error) {
      console.error('Error al actualizar archivo de ticket:', error.message);
      throw new InternalServerErrorException('Error al actualizar archivo');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({ where: { id } });

      if (!file) {
        throw new NotFoundException(`Archivo con id ${id} no encontrado`);
      }

      await this.fileRepository.remove(file);
      await this.cacheManager.delCache(`ticketFile:${id}`);
      await this.cacheManager.delCache(`ticketFiles:*`);
    } catch (error) {
      console.error('Error al eliminar archivo de ticket:', error.message);
      throw new InternalServerErrorException('Error al eliminar archivo');
    }
  }
}
