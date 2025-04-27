import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CACHE_TTL } from 'src/common/constants';
import { TicketStateService } from '../ticket-state/ticket-state.service';
import { EmailService } from 'src/common/email/email.service';
import { userSession } from 'src/common/types';
import { UsersService } from '../users/users.service';
import { AssignedUserTicket } from '../assigned-user-ticket/entities/assigned-user-ticket.entity';


@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly cacheManager: CacheManagerService,
    private readonly ticketStateService: TicketStateService,
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createTicketDto: Partial<CreateTicketDto>,
    user: userSession,
  ): Promise<{ data: Ticket; message: string }> {
    const queryRunner = this.ticketRepository.manager.connection.createQueryRunner();
  
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      if (!user?.id) {
        throw new BadRequestException('User not authenticated');
      }
  
      const [ticketState, agentDefault] = await Promise.all([
        this.ticketStateService.findByOrder(1),
        this.userService.findDefaultAgent(user.branchId).catch(() => {
          throw new NotFoundException('No available agent found for assignment');
        }),
      ]);
  
      if (!ticketState) {
        throw new NotFoundException('Initial ticket state not found');
      }
  
      if (!createTicketDto.ticketTitleId) {
        throw new BadRequestException('Ticket title is required');
      }
  
      const ticketData = {
        ...createTicketDto,
        userId: user.id,
        ticketStateId: ticketState.id,
      };
  
      const newTicket = this.ticketRepository.create(ticketData);
      const savedTicket = await queryRunner.manager.save(newTicket);
  
      // Crear asignación de agente usando el patrón limpio y consistente
      const assigned = this.assignedUserTicketRepository.create({
        userId: agentDefault.id,
        ticketId: savedTicket.id,
      });
      await queryRunner.manager.save(assigned);
  
      await queryRunner.commitTransaction();
  
      const resultData = await this.findOne(savedTicket.id);
   
      let emailStatus = 'Ticket created successfully';
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: resultData.ticketState.description,
          prefix: resultData.ticketTitle.ticketCategory.prefix,
          ticketId: resultData.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: resultData.ticketTitle.ticketPriority.title,
          ticketCreatedAt: resultData.createdAt,
        };
  
        await this.emailService.sendEmail(
          user.email,
          `${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
          'email-template.html',
          emailData,
        );
      } catch (emailError) {
        emailStatus =
          'Ticket was created successfully, but the email notification could not be sent. Please contact Branzon Tech support';
      }
  
      await this.cacheManager.delCache(`tickets:*`);
  
      return {
        data: savedTicket,
        message:emailStatus,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
  
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
  
      const message = error?.message || 'Unexpected error';
      throw new InternalServerErrorException(`An error occurred while creating the ticket: ${message}`);
    } finally {
      await queryRunner.release();
    }
  }
  
  

  async findAll(user:userSession, skip: number = 0, take: number = 10, filter?: string) {
    try {
  
      const cacheKey = `tickets:userId:${user.id}skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{
        data: Ticket[];
        total: number;
      }>(cacheKey);
  
      if (cachedData) return cachedData;
  
      const queryBuilder = this.ticketRepository.createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticket.user', 'user')
        .leftJoinAndSelect('user.company', 'company')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
        .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers')
        .leftJoinAndSelect('assignedUsers.user', 'agent');

      if (!user.role.isConfigurator ) { 
        if (user.role.isAgent) {
          queryBuilder.andWhere('assignedUsers.userId = :angentId', { 
            angentId: user.id,
          });
        }else{
          queryBuilder.andWhere('ticket.userId = :userId', { 
            userId: user.id,
          });
        }
       }
  
      if (filter) {
        queryBuilder.andWhere('ticketTitle.description ILIKE :filter', {
          filter: `%${filter}%`,
        });
      }
  
      queryBuilder.orderBy('ticket.createdAt', 'DESC').skip(skip).take(take);
  
      const [tickets, total] = await queryBuilder.getManyAndCount();
  
      const result = { data: tickets, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Failed to fetch the list of tickets.',
      );
    }
  }
  

  async findOne(id: string): Promise<Ticket> {
    try {
      const cacheKey = `ticket:${id}`;
      let ticket = await this.cacheManager.getCache<Ticket>(cacheKey);

      if (!ticket) {
        ticket = await this.ticketRepository.findOne({
          where: { id },
          relations: [
            'ticketState',
            'ticketTitle',
            'user',
            'ticketTitle.ticketCategory',
            'ticketTitle.ticketPriority',
          ],
        });
        if (!ticket) {
          throw new NotFoundException(`Ticket con ID '${id}' no encontrado.`);
        }
        await this.cacheManager.setCache(cacheKey, ticket);
      }

      return ticket;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException('No se pudo obtener el ticket.');
    }
  }

  async updateStatusToAssisted(id: string): Promise<{data:Ticket, message:string}> {
    try {
      // Find the state with order 3
      const ticketState = await this.ticketStateService.findByOrder(3);
      if (!ticketState) {
        throw new NotFoundException(`State with order '3' not found.`);
      }
  
      // Preload to update
      const ticket = await this.ticketRepository.preload({
        id,
        ticketStateId: ticketState.id,
      });
  
      if (!ticket) {
        throw new NotFoundException(`Ticket with ID '${id}' not found.`);
      }
      
      const updatedTicket = await this.ticketRepository.save(ticket);
      
      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(`Error finding ticket user.`);
      }
      
      const resultData = await this.findOne(updatedTicket.id);
      let emailStatus = 'Ticket pass to Assisted successfully';
      const prefix=resultData.ticketTitle.ticketCategory.prefix;
      const priority=resultData.ticketTitle.ticketPriority.title;
      
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: ticketState.description,
          prefix: prefix,
          ticketNumber: resultData.ticketNumber,
          ticketId: resultData.id,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };
  
        await this.emailService.sendEmail(
          user.email,
          `Actualizacion ${prefix}-${updatedTicket.ticketNumber}`,
          'email-template.html',
          emailData,
        );
      } catch (emailError) {
        console.log(emailError)
        emailStatus =
        'Ticket was pass to Assisted successfully, but the email notification could not be sent. Please contact Branzon Tech support';
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
      return {
        data: updatedTicket,
        message:emailStatus,
      };
     
    } catch (error) {
      console.error('Error in updateStatusToAssisted:', error);
      throw new InternalServerErrorException(
        'Failed to update the ticket status.',
      );
    }
  }

  async updateStatusToCloseted(id: string): Promise<{data:Ticket, message:string}> {
    try {
      console.log("updateStatusToCloseted")
      const ticketLastState = await this.ticketStateService.findLastTicketState();
      if (!ticketLastState) {
        throw new NotFoundException(`Error finding last state.`);
      }
  
      // Preload to update
      const ticket = await this.ticketRepository.preload({
        id,
        ticketStateId: ticketLastState.id,
      });
  
      if (!ticket) {
        throw new NotFoundException(`Ticket with ID '${id}' not found.`);
      }
  
      const updatedTicket = await this.ticketRepository.save(ticket);
      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(`Error finding ticket user.`);
      }
      const resultData = await this.findOne(updatedTicket.id);
      
      let emailStatus = 'Ticket Closeted successfully';
      const prefix=resultData.ticketTitle.ticketCategory.prefix;
      const priority=resultData.ticketTitle.ticketPriority.title;
      
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: resultData.ticketState.description,
          prefix: prefix,
          ticketId: resultData.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };
  
        await this.emailService.sendEmail(
          user.email,
          `Actualizacion ${prefix}-${updatedTicket.ticketNumber}`,
          'email-template-closet.html',
          emailData,
        );
      } catch (emailError) {
        console.log(emailError)
        emailStatus ='Ticket was pass to Closeted successfully, but the email notification could not be sent. Please contact Branzon Tech support';
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
  
      return {
        data: updatedTicket,
        message:emailStatus,
      };
    } catch (error) {
      console.error('Error in updateStatusToCloseted:', error);
      throw new InternalServerErrorException(
        'Failed to update the ticket status.',
      );
    }
  }
  
  
  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    try {
      const ticket = await this.ticketRepository.preload({
        id,
        ...updateTicketDto,
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID '${id}' no encontrado.`);
      }

      const updatedTicket = await this.ticketRepository.save(ticket);
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);

      return updatedTicket;
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el ticket.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const ticket = await this.ticketRepository.findOne({ where: { id } });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID '${id}' no encontrado.`);
      }

      await this.ticketRepository.softDelete(id);
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException('No se pudo eliminar el ticket.');
    }
  }
}
