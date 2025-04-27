import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(createTicketCategoryDto: CreateTicketCategoryDto): Promise<TicketCategory> {
    try {
      const existingCategory = await this.ticketCategoryRepository.findOne({
        where: { prefix: createTicketCategoryDto.prefix },
      });

      if (existingCategory) {
        throw new ConflictException(`La categoría con prefijo '${createTicketCategoryDto.prefix}' ya existe.`);
      }

      const category = this.ticketCategoryRepository.create(createTicketCategoryDto);
      const savedCategory = await this.ticketCategoryRepository.save(category);

      await this.cacheManager.delCache(`ticketCategories:*`);
      return savedCategory;
    } catch (error) {
      console.error('Error en create:', error);
      throw new InternalServerErrorException('No se pudo crear la categoría de ticket.');
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: TicketCategory[]; total: number }> {
    try {
      const cacheKey = `ticketCategories:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{ data: TicketCategory[]; total: number }>(cacheKey);
  
      if (cachedData) return cachedData;
  
      const queryBuilder = this.ticketCategoryRepository.createQueryBuilder('ticketCategory');
  
      if (filter) {
        queryBuilder.where('ticketCategory.description ILIKE :filter OR ticketCategory.prefix ILIKE :filter', {
          filter: `%${filter}%`,
        });
      }
  
      queryBuilder.skip(skip).take(take);
  
      const [categories, total] = await queryBuilder.getManyAndCount();
  
      const result = { data: categories, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException('Failed to fetch ticket categories.');
    }
  }
  

  async findOne(id: string): Promise<TicketCategory> {
    try {
      const cacheKey = `ticketCategory:${id}`;
      let category = await this.cacheManager.getCache<TicketCategory>(cacheKey);

      if (!category) {
        category = await this.ticketCategoryRepository.findOne({ where: { id } });
        if (!category) {
          throw new NotFoundException(`Categoría de ticket con ID '${id}' no encontrada.`);
        }
        await this.cacheManager.setCache(cacheKey, category);
      }

      return category;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException('No se pudo obtener la categoría de ticket.');
    }
  }

  async update(id: string, updateTicketCategoryDto: UpdateTicketCategoryDto): Promise<TicketCategory> {
    try {
      const category = await this.ticketCategoryRepository.preload({ id, ...updateTicketCategoryDto });

      if (!category) {
        throw new NotFoundException(`Categoría de ticket con ID '${id}' no encontrada.`);
      }

      const updatedCategory = await this.ticketCategoryRepository.save(category);
      await this.cacheManager.delCache(`ticketCategory:${id}`);
      await this.cacheManager.delCache(`ticketCategories:*`);

      return updatedCategory;
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException('No se pudo actualizar la categoría de ticket.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const category = await this.ticketCategoryRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Categoría de ticket con ID '${id}' no encontrada.`);
      }

      await this.ticketCategoryRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketCategory:${id}`);
      await this.cacheManager.delCache(`ticketCategories:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException('No se pudo eliminar la categoría de ticket.');
    }
  }
}
