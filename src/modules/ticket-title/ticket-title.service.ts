import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { TicketTitle } from './entities/ticket-title.entity';
import { CreateTicketTitleDto } from './dto/create-ticket-title.dto';
import { UpdateTicketTitleDto } from './dto/update-ticket-title.dto';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class TicketTitleService {
  constructor(
    @InjectRepository(TicketTitle)
    private readonly ticketTitleRepository: Repository<TicketTitle>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createTicketTitleDto: CreateTicketTitleDto,
  ): Promise<TicketTitle> {
    try {
      const existingTitle = await this.ticketTitleRepository.findOne({
        where: { description: createTicketTitleDto.description },
      });

      if (existingTitle) {
        throw new ConflictException(
          `El título con descripción '${createTicketTitleDto.description}' ya existe.`,
        );
      }

      const title = this.ticketTitleRepository.create(createTicketTitleDto);
      const savedTitle = await this.ticketTitleRepository.save(title);

      await this.cacheManager.delCache(`ticketTitles:*`);
      return savedTitle;
    } catch (error) {
      console.error('Error en create:', error);
      throw new InternalServerErrorException(
        'No se pudo crear el título de ticket.',
      );
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `ticketTitles:skip:${skip}:take:${take}:filter:${filter || ''}`;  
      const cachedData = await this.cacheManager.getCache<{
        data: TicketTitle[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const queryBuilder = this.ticketTitleRepository
        .createQueryBuilder('ticketTitles')
        .leftJoinAndSelect('ticketTitles.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticketTitles.ticketPriority', 'ticketPriority');

      // Filtro primero
      if (filter) {
        queryBuilder.andWhere(
          `
        ticketTitles.description ILIKE :filter OR 
        ticketCategory.description ILIKE :filter OR 
        ticketPriority.title ILIKE :filter OR 
      `,
          { filter: `%${filter}%` },
        );
      }

      // Paginado después de filtrar
      queryBuilder.skip(skip).take(take);

      const [titles, total] = await queryBuilder.getManyAndCount();

      const result = { data: titles, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener la lista de títulos de ticket.',
      );
    }
  }

  async findOne(id: string): Promise<TicketTitle> {
    try {
      const cacheKey = `ticketTitle:${id}`;
      let title = await this.cacheManager.getCache<TicketTitle>(cacheKey);

      if (!title) {
        title = await this.ticketTitleRepository.findOne({ where: { id } });
        if (!title) {
          throw new NotFoundException(
            `Título de ticket con ID '${id}' no encontrado.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, title);
      }

      return title;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el título de ticket.',
      );
    }
  }

  async findByCategory(ticketCategoryId: string): Promise<{data:TicketTitle[]}> {
    try {
      const cacheKey = `ticketTitle:category-${ticketCategoryId}`;
      let titles = await this.cacheManager.getCache<TicketTitle[]>(cacheKey);

      if (!titles) {
        titles = await this.ticketTitleRepository.find({ where: { ticketCategoryId } });
        
        await this.cacheManager.setCache(cacheKey, titles);
      }

      return {data:titles};
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el título de ticket.',
      );
    }
  }

  async update(
    id: string,
    updateTicketTitleDto: UpdateTicketTitleDto,
  ): Promise<TicketTitle> {
    try {
      const title = await this.ticketTitleRepository.preload({
        id,
        ...updateTicketTitleDto,
      });

      if (!title) {
        throw new NotFoundException(
          `Título de ticket con ID '${id}' no encontrado.`,
        );
      }

      const updatedTitle = await this.ticketTitleRepository.save(title);
      await this.cacheManager.delCache(`ticketTitle:${id}`);
      await this.cacheManager.delCache(`ticketTitles:*`);

      return updatedTitle;
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el título de ticket.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const title = await this.ticketTitleRepository.findOne({ where: { id } });

      if (!title) {
        throw new NotFoundException(
          `Título de ticket con ID '${id}' no encontrado.`,
        );
      }

      await this.ticketTitleRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketTitle:${id}`);
      await this.cacheManager.delCache(`ticketTitles:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException(
        'No se pudo eliminar el título de ticket.',
      );
    }
  }
}
