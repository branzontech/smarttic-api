import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { TicketCategory } from './entities/ticket-category.entity';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class TicketCategoryService {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly ticketCategoryRepository: Repository<TicketCategory>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createDto: CreateTicketCategoryDto,
  ): Promise<TicketCategory> {
    try {
      const existing = await this.ticketCategoryRepository.findOne({
        where: { prefix: createDto.prefix },
      });

      if (existing) {
        throw new ConflictException(
          `La categoría con prefijo '${createDto.prefix}' ya existe.`,
        );
      }

      const category = this.ticketCategoryRepository.create(createDto);
      const saved = await this.ticketCategoryRepository.save(category);

      await this.cacheManager.delCache(`ticketCategories:*`);
      return saved;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof HttpException) {
        throw error;
      }
      console.error('Error en create:', error);
      throw new InternalServerErrorException(
        'No se pudo crear la categoría de ticket.',
      );
    }
  }

  async findAll(
    skip = 0,
    take = 10,
    filter?: string,
  ): Promise<{ data: TicketCategory[]; total: number }> {
    try {
      const cacheKey = `ticketCategories:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{
        data: TicketCategory[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const query = this.ticketCategoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.ticketTitles', 'ticketTitles')
        .where('category.deletedAt IS NULL')
        .orderBy('category.createdAt', 'DESC')
        .skip(skip)
        .take(take);

      if (filter) {
        query.andWhere(
          `category.description ILIKE :filter OR category.prefix ILIKE :filter OR form.name ILIKE :filter`,
          { filter: `%${filter}%` },
        );
      }

      const [data, total] = await query.getManyAndCount();

      const result = { data, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException(
        'No se pudo listar las categorías.',
      );
    }
  }  

  async findAvailable(): Promise<{id: string, description: string}[]> {
    try {
      return await this.ticketCategoryRepository.find({
        select: ['id', 'description'],
        where: { 
          state: true 
        },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error en findAvailable:', error);
      throw new InternalServerErrorException('No se pudo listar las categorías disponibles');
    }
  }

  async findOne(id: string): Promise<TicketCategory> {
    try {
      const cacheKey = `ticketCategory:${id}`;
      let category = await this.cacheManager.getCache<TicketCategory>(cacheKey);

      if (!category) {
        category = await this.ticketCategoryRepository.findOne({
          where: { id },
          relations: ['form', 'ticketTitles'],
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría de ticket con ID '${id}' no encontrada.`,
          );
        }

        await this.cacheManager.setCache(cacheKey, category);
      }

      return category;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener la categoría de ticket.',
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateTicketCategoryDto,
  ): Promise<TicketCategory> {
    try {
      // 1. Verificar si la categoría existe
      const existing = await this.ticketCategoryRepository.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Categoría de ticket con ID '${id}' no encontrada.`);
      }

      // 2. Validar que no exista otra categoría con el mismo prefix
      if (updateDto.prefix) {
        const categoryWithSamePrefix = await this.ticketCategoryRepository.findOne({
          where: {
            prefix: updateDto.prefix,
            id: Not(id), // Excluir la actual
          },
        });

        if (categoryWithSamePrefix) {
          throw new ConflictException(
            `La categoría con prefijo '${updateDto.prefix}' ya existe.`,
          );
        }
      }

      // 3. Actualizar la categoría
      const updatedCategory = await this.ticketCategoryRepository.save({
        ...existing,
        ...updateDto,
      });

      // 4. Limpiar caché
      await this.cacheManager.delCache(`ticketCategory:${id}`);
      await this.cacheManager.delCache(`ticketCategories:*`);

      return updatedCategory;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error.code === '23505') {
        throw new ConflictException(
          `La categoría con prefijo '${updateDto.prefix}' ya existe.`,
        );
      }

      console.error('Error en update:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar la categoría de ticket.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const category = await this.ticketCategoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(
          `Categoría con ID '${id}' no encontrada.`,
        );
      }

      await this.ticketCategoryRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketCategory:${id}`);
      await this.cacheManager.delCache(`ticketCategories:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException(
        'No se pudo eliminar la categoría de ticket.',
      );
    }
  }
}
