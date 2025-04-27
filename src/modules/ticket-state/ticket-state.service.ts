import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTicketStateDto } from './dto/create-ticket-state.dto';
import { UpdateTicketStateDto } from './dto/update-ticket-state.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { TicketState } from './entities/ticket-state.entity';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class TicketStateService {
  constructor(
    @InjectRepository(TicketState)
    private readonly ticketStateRepository: Repository<TicketState>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createTicketStateDto: CreateTicketStateDto,
  ): Promise<TicketState> {
    try {
      const existingTicketState = await this.ticketStateRepository.findOne({
        where: { title: createTicketStateDto.title },
      });

      if (existingTicketState) {
        throw new ConflictException(
          `Ticket state '${createTicketStateDto.title}' already exists.`,
        );
      }

      const ticketState =
        this.ticketStateRepository.create(createTicketStateDto);
      const savedTicketState =
        await this.ticketStateRepository.save(ticketState);

      await this.cacheManager.delCache(`ticketStates:*`);
      return savedTicketState;
    } catch (error) {
      console.error('Error in create:', error);
      throw new InternalServerErrorException(
        'Could not create the ticket state.',
      );
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: TicketState[]; total: number }> {
    try {
      const cacheKey = `ticketStates:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{
        data: TicketState[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const queryBuilder =
        this.ticketStateRepository.createQueryBuilder('ticketState');

      // Aplicar el filtro si existe
      if (filter) {
        queryBuilder.where('ticketState.description ILIKE :filter', {
          filter: `%${filter}%`,
        });
      }

      // Aplicar paginación
      queryBuilder.skip(skip).take(take);

      const [ticketStates, total] = await queryBuilder.getManyAndCount();

      const result = { data: ticketStates, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Could not retrieve the list of ticket states.',
      );
    }
  }

  async findOne(id: string): Promise<TicketState> {
    try {
      const cacheKey = `ticketState:${id}`;
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        ticketState = await this.ticketStateRepository.findOne({
          where: { id },
        });
        if (!ticketState) {
          throw new NotFoundException(
            `Ticket state with ID '${id}' not found.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException(
        'Could not retrieve the ticket state.',
      );
    }
  }

  async findByOrder(order: number): Promise<TicketState> {
    try {
      const cacheKey = `ticketState:order-${order}`;
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        ticketState = await this.ticketStateRepository.findOne({
          where: { orderTicket: order, state: true },
        });
        if (!ticketState) {
          throw new NotFoundException(
            `Ticket state with order '${order}' not found.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      console.error('Error in findByOrder:', error);
      throw new InternalServerErrorException(
        'Could not retrieve the ticket state.',
      );
    }
  }

  async findLastTicketState(): Promise<TicketState> {
    try {
      const cacheKey = 'ticketState:last';
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        // Buscar el registro con el orderTicket más alto y state: true
        ticketState = await this.ticketStateRepository.findOne({
          where: { state: true },
          order: { orderTicket: 'DESC' }, // Ordenar por orderTicket descendente
        });

        if (!ticketState) {
          throw new NotFoundException('No active ticket states found.');
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      console.error('Error in findLastTicketState:', error);
      throw new InternalServerErrorException(
        'Could not retrieve the last ticket state.',
      );
    }
  }

  async update(
    id: string,
    updateTicketStateDto: UpdateTicketStateDto,
  ): Promise<TicketState> {
    try {
      const ticketState = await this.ticketStateRepository.preload({
        id,
        ...updateTicketStateDto,
      });

      if (!ticketState) {
        throw new NotFoundException(`Ticket state with ID '${id}' not found.`);
      }

      const updatedTicketState =
        await this.ticketStateRepository.save(ticketState);
      await this.cacheManager.delCache(`ticketState:${id}`);
      await this.cacheManager.delCache(`ticketStates:*`);

      return updatedTicketState;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException(
        'Could not update the ticket state.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const ticketState = await this.ticketStateRepository.findOne({
        where: { id },
      });

      if (!ticketState) {
        throw new NotFoundException(`Ticket state with ID '${id}' not found.`);
      }

      await this.ticketStateRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketState:${id}`);
      await this.cacheManager.delCache(`ticketStates:*`);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException(
        'Could not delete the ticket state.',
      );
    }
  }
}
