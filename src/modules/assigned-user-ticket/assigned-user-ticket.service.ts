import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedUserTicket } from './entities/assigned-user-ticket.entity';
import { CreateAssignedUserTicketDto } from './dto/create-assigned-user-ticket.dto';
import { UpdateAssignedUserTicketDto } from './dto/update-assigned-user-ticket.dto';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';


@Injectable()
export class AssignedUserTicketService {
  constructor(
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(dto: CreateAssignedUserTicketDto) {
    try {
      const { userId, ticketId } = dto;
      
      // Validar que el usuario existe
      const user = await this.getUserById(userId);
      
      // Validar que el ticket existe
      const ticket = await this.getTicketById(ticketId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      
      if (!ticket) {
        throw new BadRequestException(`Ticket with id ${ticketId} not found`);
      }
      
      // Validar que la asignación no exista previamente
      await this.ensureAssignmentDoesNotExist(userId, ticketId);

      const assignedUserTicket = this.assignedUserTicketRepository.create(dto);
      
      const savedAssignedUserTicket = await this.assignedUserTicketRepository.save(assignedUserTicket);

      // Invalidar caché relacionado
      await this.cacheManager.delCache('assignedUserTickets:*');
      return savedAssignedUserTicket;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
    
      if (error.message) {
        throw new InternalServerErrorException(
          error.message
        );
      }
    
      throw new InternalServerErrorException(`Error creating AssignedUserTicket: ${error.message}`);
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `assignedUserTickets:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache(cacheKey);
      if (cachedData) return cachedData;

      const query = this.assignedUserTicketRepository
        .createQueryBuilder('assignedUserTicket')
        .leftJoinAndSelect('assignedUserTicket.user', 'user')
        .leftJoinAndSelect('assignedUserTicket.ticket', 'ticket')
        .skip(skip)
        .take(take);

      if (filter) {
        query.where(
          'user.name LIKE :filter OR user.email LIKE :filter OR ticket.title LIKE :filter OR ticket.code LIKE :filter',
          { filter: `%${filter}%` }
        );
      }

      const [assignedUserTickets, total] = await query.getManyAndCount();

      const result = { 
        data: assignedUserTickets, 
        total, 
        message: 'Assigned User Tickets List' 
      };
      
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching AssignedUserTickets: ${error.message}`);
    }
  }

  async findById(id: string): Promise<AssignedUserTicket> {
    try {
      const cacheKey = `assignedUserTicket:${id}`;
      const cachedAssignedUserTicket = await this.cacheManager.getCache<AssignedUserTicket>(cacheKey);
      if (cachedAssignedUserTicket) return cachedAssignedUserTicket;

      const assignedUserTicket = await this.getAssignedUserTicketById(id);
      await this.cacheManager.setCache(cacheKey, assignedUserTicket, CACHE_TTL);
      return assignedUserTicket;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching AssignedUserTicket with id ${id}: ${error.message}`);
    }
  }

  async findByTicketId(ticketId: string): Promise<AssignedUserTicket[]> {
    try {
      const cacheKey = `assignedUserTickets:ticket:${ticketId}`;
      const cachedData = await this.cacheManager.getCache<AssignedUserTicket[]>(cacheKey);
      if (cachedData) return cachedData;

      await this.getTicketById(ticketId); // Validar que el ticket existe
      
      const assignedUserTickets = await this.assignedUserTicketRepository.find({
        where: { ticketId },
        relations: ['user'],
      });

      await this.cacheManager.setCache(cacheKey, assignedUserTickets, CACHE_TTL);
      return assignedUserTickets;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching AssignedUserTickets for ticket ${ticketId}: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateAssignedUserTicketDto): Promise<AssignedUserTicket> {
    try {
      const existingAssignedUserTicket = await this.getAssignedUserTicketById(id);
      
      if (dto.userId) {
        await this.getUserById(dto.userId); // Validar que el nuevo usuario existe
      }
      
      if (dto.ticketId) {
        await this.getTicketById(dto.ticketId); // Validar que el nuevo ticket existe
      }

      const updatedAssignedUserTicket = await this.assignedUserTicketRepository.save({
        ...existingAssignedUserTicket,
        ...dto,
      });

      await this.cacheManager.delCache(`assignedUserTicket:${id}`);
      await this.cacheManager.delCache('assignedUserTickets:*');
      return updatedAssignedUserTicket;
    } catch (error) {
      throw new InternalServerErrorException(`Error updating AssignedUserTicket with id ${id}: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const assignedUserTicket = await this.getAssignedUserTicketById(id);
      await this.assignedUserTicketRepository.softDelete(id);
      
      await this.cacheManager.delCache(`assignedUserTicket:${id}`);
      await this.cacheManager.delCache('assignedUserTickets:*');
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting AssignedUserTicket with id ${id}: ${error.message}`);
    }
  }

  private async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  private async getTicketById(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ 
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException(`Ticket with id ${ticketId} not found`);
    return ticket;
  }

  private async getAssignedUserTicketById(id: string): Promise<AssignedUserTicket> {
    const assignedUserTicket = await this.assignedUserTicketRepository.findOne({ 
      where: { id },
      relations: ['user', 'ticket'],
    });
    if (!assignedUserTicket) throw new NotFoundException(`AssignedUserTicket with id ${id} not found`);
    return assignedUserTicket;
  }

  private async ensureAssignmentDoesNotExist(userId: string, ticketId: string) {
    const exist = await this.assignedUserTicketRepository.findOne({ 
      where: { userId, ticketId },
    });
    if (exist) {
      throw new BadRequestException(
        `User with id ${userId} is already assigned to ticket with id ${ticketId}`
      );
    }
  }
}