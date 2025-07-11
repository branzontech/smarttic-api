import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormResponseFile } from './entities/form-response-file.entity';
import { CreateFormResponseFileDto } from './dto/create-form-response-file.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class FormResponseFilesService {
  constructor(
    @InjectRepository(FormResponseFile)
    private readonly fileRepository: Repository<FormResponseFile>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(dto: CreateFormResponseFileDto): Promise<FormResponseFile> {
    try {
      const existing = await this.fileRepository.findOne({
        where: {
          formResponseId: dto.formResponseId,
          fieldKey: dto.fieldKey,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe un archivo para el campo '${dto.fieldKey}' en la respuesta dada.`,
        );
      }

      const file = this.fileRepository.create(dto);
      const saved = await this.fileRepository.save(file);

      await this.cacheManager.delCache(`formResponseFiles:*`);
      return saved;
    } catch (error) {
      console.error('Error al crear archivo log:', error.message);
      throw new InternalServerErrorException('Error al guardar el archivo');
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    const cacheKey = `formResponseFiles:skip:${skip}:take:${take}:filter:${filter || ''}`;
    const cached = await this.cacheManager.getCache(cacheKey);
    if (cached) return cached;

    const query = this.fileRepository.createQueryBuilder('file');

    if (filter) {
      query.where('file.fieldKey ILIKE :filter OR file.filename ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }

    query.orderBy('file.createdAt', 'DESC').skip(skip).take(take);

    const [data, total] = await query.getManyAndCount();
    const result = { data, total };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<FormResponseFile> {
    const cacheKey = `formResponseFile:${id}`;
    const cached = await this.cacheManager.getCache<FormResponseFile>(cacheKey);
    if (cached) return cached;

    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException(`Archivo con id ${id} no encontrado`);
    }

    await this.cacheManager.setCache(cacheKey, file, CACHE_TTL);
    return file;
  }

  async remove(id: string): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({ where: { id } });

      if (!file) {
        throw new NotFoundException(`Archivo con id ${id} no encontrado`);
      }

      await this.fileRepository.softDelete(id);
      await this.cacheManager.delCache(`formResponseFile:${id}`);
      await this.cacheManager.delCache(`formResponseFiles:*`);
    } catch (error) {
      console.error('Error al eliminar archivo log:', error.message);
      throw new InternalServerErrorException(
        `Error al eliminar el archivo con id ${id}`,
      );
    }
  }
}
