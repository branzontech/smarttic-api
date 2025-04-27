import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { TicketPriority } from './entities/ticket-priority.entity';
import { CreateTicketPriorityDto } from './dto/create-ticket-priority.dto';
import { UpdateTicketPriorityDto } from './dto/update-ticket-priority.dto';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class TicketPriorityService {
  constructor(
    @InjectRepository(TicketPriority)
    private readonly ticketPriorityRepository: Repository<TicketPriority>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createTicketPriorityDto: CreateTicketPriorityDto): Promise<TicketPriority> {
    try {
      const existingPriority = await this.ticketPriorityRepository.findOne({
        where: { title: createTicketPriorityDto.title },
      });

      if (existingPriority) {
        throw new ConflictException(`La prioridad con título '${createTicketPriorityDto.title}' ya existe.`);
      }

      const priority = this.ticketPriorityRepository.create(createTicketPriorityDto);
      const savedPriority = await this.ticketPriorityRepository.save(priority);

      await this.cacheManager.delCache(`ticketPriorities:*`);
      return savedPriority;
    } catch (error) {
      console.error('Error en create:', error);
      throw new InternalServerErrorException('No se pudo crear la prioridad de ticket.');
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: TicketPriority[]; total: number }> {
    try {
      const cacheKey = `ticketPriorities:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{ data: TicketPriority[]; total: number }>(cacheKey);
  
      if (cachedData) return cachedData;
  
      const queryBuilder = this.ticketPriorityRepository.createQueryBuilder('ticketPriority');
  
      if (filter) {
        queryBuilder.where('ticketPriority.description ILIKE :filter', {
          filter: `%${filter}%`,
        });
      }
  
      queryBuilder.skip(skip).take(take);
  
      const [priorities, total] = await queryBuilder.getManyAndCount();
  
      const result = { data: priorities, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException('Failed to fetch ticket priorities.');
    }
  }
  

  async findOne(id: string): Promise<TicketPriority> {
    try {
      const cacheKey = `ticketPriority:${id}`;
      let priority = await this.cacheManager.getCache<TicketPriority>(cacheKey);

      if (!priority) {
        priority = await this.ticketPriorityRepository.findOne({ where: { id } });
        if (!priority) {
          throw new NotFoundException(`Prioridad de ticket con ID '${id}' no encontrada.`);
        }
        await this.cacheManager.setCache(cacheKey, priority);
      }

      return priority;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException('No se pudo obtener la prioridad de ticket.');
    }
  }

  async update(id: string, updateTicketPriorityDto: UpdateTicketPriorityDto): Promise<TicketPriority> {
    try {
      const priority = await this.ticketPriorityRepository.preload({ id, ...updateTicketPriorityDto });

      if (!priority) {
        throw new NotFoundException(`Prioridad de ticket con ID '${id}' no encontrada.`);
      }

      const updatedPriority = await this.ticketPriorityRepository.save(priority);
      await this.cacheManager.delCache(`ticketPriority:${id}`);
      await this.cacheManager.delCache(`ticketPriorities:*`);

      return updatedPriority;
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException('No se pudo actualizar la prioridad de ticket.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const priority = await this.ticketPriorityRepository.findOne({ where: { id } });

      if (!priority) {
        throw new NotFoundException(`Prioridad de ticket con ID '${id}' no encontrada.`);
      }

      await this.ticketPriorityRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketPriority:${id}`);
      await this.cacheManager.delCache(`ticketPriorities:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException('No se pudo eliminar la prioridad de ticket.');
    }
  }
}
