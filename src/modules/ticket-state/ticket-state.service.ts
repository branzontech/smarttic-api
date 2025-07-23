import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTicketStateDto } from './dto/create-ticket-state.dto';
import { UpdateTicketStateDto } from './dto/update-ticket-state.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
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
          `El estado del ticket '${createTicketStateDto.title}' ya existe.`,
        );
      }

      await this.validatePreapprovalFlags(createTicketStateDto);

      const ticketState = this.ticketStateRepository.create(createTicketStateDto);
      const savedTicketState = await this.ticketStateRepository.save(ticketState);

      await this.cacheManager.delCache(`ticketStates:*`);
      return savedTicketState;
    } catch (error) {
      this.handleError(error, 'No se pudo crear el estado del ticket.');
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

      queryBuilder.orderBy('ticketState.createdAt', 'DESC').skip(skip).take(take);

      const [ticketStates, total] = await queryBuilder.getManyAndCount();

      const result = { data: ticketStates, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar la lista de estados de los tickets.');
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
            `No se encontró el estado del ticket con ID '${id}'.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el estado del ticket.');
    }
  }

  async findByOrder(order: number): Promise<TicketState> {
    try {
      const cacheKey = `ticketState:order-${order}`;
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        ticketState = await this.ticketStateRepository.findOne({
          where: { orderTicket: order, state: true, isInitialPreapproval: false, isRejectedPreapproval: false },
        });
        if (!ticketState) {
          throw new NotFoundException(
            `No se encontró el estado del ticket con el pedido '${order}'.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el estado del ticket.');
    }
  }

  async findFirstTicketState(manager?: EntityManager): Promise<TicketState> {
    try {
      const cacheKey = 'ticketState:first';
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        const repo = manager ? manager.getRepository(TicketState) : this.ticketStateRepository;
        ticketState = await  repo.findOne({
          where: { state: true, isInitialPreapproval: false, isRejectedPreapproval: false },
          order: { orderTicket: 'ASC' }, 
        });

        if (!ticketState) {
          throw new NotFoundException('No se encontraron estados de tickets activos.');
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el primer estado del ticket.');
    }
  }

  async findInitialPreapprovalTicketState(manager?: EntityManager): Promise<TicketState> {
    try {
      const cacheKey = 'ticketState:nitialPreapproval';
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        const repo = manager ? manager.getRepository(TicketState) : this.ticketStateRepository;
        ticketState = await repo.findOne({
          where: { state: true, isInitialPreapproval: true, isRejectedPreapproval: false },
          order: { orderTicket: 'ASC' }, 
        });

        if (!ticketState) {
          throw new NotFoundException('No se encontraron estados de tickets activos.');
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el primer estado del ticket.');
    }
  }

  async findRejectedPreapprovalTicketState(manager?: EntityManager): Promise<TicketState> {
    try {
      const cacheKey = 'ticketState:first';
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
        const repo = manager ? manager.getRepository(TicketState) : this.ticketStateRepository;
        ticketState = await repo.findOne({
          where: { state: true, isInitialPreapproval: false, isRejectedPreapproval: true },
          order: { orderTicket: 'ASC' }, 
        });

        if (!ticketState) {
          throw new NotFoundException('No se encontraron estados de tickets activos.');
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el primer estado del ticket.');
    }
  }

  async findLastTicketState(manager?: EntityManager): Promise<TicketState> {
    try {
      const cacheKey = 'ticketState:last';
      let ticketState = await this.cacheManager.getCache<TicketState>(cacheKey);

      if (!ticketState) {
         const repo = manager ? manager.getRepository(TicketState) : this.ticketStateRepository;
        ticketState = await repo.findOne({
          where: { state: true, isInitialPreapproval: false, isRejectedPreapproval: false },
          order: { orderTicket: 'DESC' }, 
        });

        if (!ticketState) {
          throw new NotFoundException('No se encontraron estados de tickets activos.');
        }
        await this.cacheManager.setCache(cacheKey, ticketState);
      }

      return ticketState;
    } catch (error) {
      this.handleError(error, 'No se pudo recuperar el último estado del ticket.');
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
        throw new NotFoundException(`No se encontró el estado del ticket con ID '${id}'.`);
      }

      await this.validatePreapprovalFlags(updateTicketStateDto, id);

      const updatedTicketState =
        await this.ticketStateRepository.save(ticketState);
      await this.cacheManager.delCache(`ticketState:${id}`);
      await this.cacheManager.delCache(`ticketStates:*`);

      return updatedTicketState;
    } catch (error) {
      this.handleError(error, 'No se pudo actualizar el estado del ticket.');
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
      this.handleError(error, 'No se pudo eliminar el estado del ticket.');
    }
  }

  

private async validatePreapprovalFlags(dto: CreateTicketStateDto | UpdateTicketStateDto, id?: string): Promise<void> {
  if (dto.isInitialPreapproval && dto.isRejectedPreapproval) {
    throw new BadRequestException(
      'Un estado no puede ser marcado como inicial y rechazado al mismo tiempo.',
    );
  }

  if (dto.isInitialPreapproval) {
    const where: any = {
      isInitialPreapproval: true,
      state: true,
    };
    if (id) where.id = Not(id);

    const existing = await this.ticketStateRepository.findOne({ where });
    if (existing) {
      throw new ConflictException('Ya existe un estado marcado como inicial de preaprobación.');
    }
  }

  if (dto.isRejectedPreapproval) {
    const where: any = {
      isRejectedPreapproval: true,
      state: true,
    };
    if (id) where.id = Not(id);

    const existing = await this.ticketStateRepository.findOne({ where });
    if (existing) {
      throw new ConflictException('Ya existe un estado marcado como rechazado en preaprobación.');
    }
  }
}


   private handleError(error: unknown, context: string): never {
    // Errores conocidos que deben propagarse sin modificar
    const knownErrors = [
      ConflictException,
      NotFoundException,
      BadRequestException,
      HttpException,
    ];

    if (knownErrors.some(errorType => error instanceof errorType)) {
      throw error;
    }

    console.error(`Error in ${context}:`, error);
    throw new InternalServerErrorException(
      context
    );
  }
}
