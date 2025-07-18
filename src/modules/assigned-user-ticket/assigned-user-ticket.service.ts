import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AssignedUserTicket } from './entities/assigned-user-ticket.entity';
import { CreateAssignedUserTicketDto } from './dto/create-assigned-user-ticket.dto';
import { UpdateAssignedUserTicketDto } from './dto/update-assigned-user-ticket.dto';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { TicketStateService } from '../ticket-state/ticket-state.service';
import { UsersService } from '../users/users.service';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class AssignedUserTicketService {
  constructor(
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketStateService: TicketStateService,
    private readonly cacheManager: CacheManagerService,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async create_(dto: CreateAssignedUserTicketDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { userId, ticketId } = dto;

      const user = await this.getUserById(userId);
      const ticket = await this.getTicketById(ticketId);

      if (!user)
        throw new BadRequestException(`User with id ${userId} not found`);
      if (!ticket)
        throw new BadRequestException(`Ticket with id ${ticketId} not found`);
      // Validar si el usuario ya está asignado al ticket con state=true
      await this.ensureAssignmentDoesNotExist(userId, ticketId);

      const lastState = await this.ticketStateService.findLastTicketState();

      if (user.limite_ticket) {
        const ticketsAsignados = await this.assignedUserTicketRepository
          .createQueryBuilder('assigned')
          .innerJoin('assigned.ticket', 'ticket')
          .innerJoin('ticket.ticketState', 'state')
          .where('assigned.userId = :userId', { userId })
          .andWhere('assigned.state = true')
          .andWhere('state.id != :cerradoStateId', {
            cerradoStateId: lastState.id,
          })
          .getCount();

        if (ticketsAsignados >= user.limite_ticket) {
          throw new BadRequestException(
            `El agente ${user.name} ha alcanzado su límite de tickets activos (${user.limite_ticket}).`,
          );
        }
      }

      // Actualizar a false todos los anteriores assignedUserTicket del mismo ticket
      await queryRunner.manager.update(
        AssignedUserTicket,
        { ticketId, state: true },
        { state: false },
      );

      // Crear nuevo registro con estado = true (o el que venga en el dto)
      const assignedUserTicket = queryRunner.manager.create(
        AssignedUserTicket,
        {
          ...dto,
          estado: true,
        },
      );

      const savedAssignedUserTicket =
        await queryRunner.manager.save(assignedUserTicket);

      await queryRunner.commitTransaction();
      
      const userData = await this.getUserById(userId);
      const ticketData = await this.getTicketById(ticketId);
      const emailData = {
        fullname: `${userData.name} ${userData.lastname}` || 'User',
        ticketState: ticketData.ticketState.description,
        prefix: ticketData.ticketTitle.ticketCategory.prefix,
        ticketId: ticketData.id,
        ticketNumber: ticketData.ticketNumber,
        ticketTitle: ticketData.ticketTitle.description,
        ticketPriority: ticketData.ticketTitle.ticketPriority.title,
        estimatedTime: `${ticketData.ticketTitle.ticketPriority.hoursResponse} horas`,
        ticketCreatedAt: ticketData.createdAt,
      };

      let emailStatus = 'Ticket reasignado exitosamente';
      try {
        emailData['fullname'] = userData?.name + ' ' + userData?.lastname;
        const company = await this.userService.findById(userData.companyId);
        let to=userData?.email;
        if (company?.email) {
            to=`${userData?.email},${company.email}`;
        }
        await this.emailService.sendEmail(
          to,
          `Reasignacion ${ticket.ticketTitle.ticketCategory.prefix}-${ticket.ticketNumber}`,
          'email-template-assigned.html',
          emailData,
        );
      } catch (error) {
        emailStatus =
          'El ticket se reasignó correctamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico.';
      }

      await this.cacheManager.delCache('assignedUserTickets:*');

      return {
        data: savedAssignedUserTicket,
        message: emailStatus,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error creating AssignedUserTicket: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async create(dto: CreateAssignedUserTicketDto) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const { userId, ticketId } = dto;

    const user = await queryRunner.manager.findOne(User, {
      where: { id: userId },
    });
    const ticket = await queryRunner.manager.findOne(Ticket, {
      where: { id: ticketId },
      relations: ['ticketTitle', 'ticketTitle.ticketCategory', 'ticketState'],
    });

    if (!user)
      throw new BadRequestException(`User with id ${userId} not found`);
    if (!ticket)
      throw new BadRequestException(`Ticket with id ${ticketId} not found`);

    // Validar si ya está asignado el usuario a ese ticket
    const existingAssignment = await queryRunner.manager.findOne(
      AssignedUserTicket,
      {
        where: { userId, ticketId, state: true },
      }
    );

    if (existingAssignment) {
      throw new BadRequestException(
        `El usuario ya está asignado al ticket ${ticketId}.`
      );
    }

    const lastState = await this.ticketStateService.findLastTicketState();

    // Verificar límite de tickets activos
    if (user.limite_ticket) {
      const ticketsAsignados = await queryRunner.manager
        .createQueryBuilder(AssignedUserTicket, 'assigned')
        .innerJoin('assigned.ticket', 'ticket')
        .innerJoin('ticket.ticketState', 'state')
        .where('assigned.userId = :userId', { userId })
        .andWhere('assigned.state = true')
        .andWhere('state.id != :cerradoStateId', {
          cerradoStateId: lastState.id,
        })
        .getCount();

      if (ticketsAsignados >= user.limite_ticket) {
        throw new BadRequestException(
          `El agente ${user.name} ha alcanzado su límite de tickets activos (${user.limite_ticket}).`
        );
      }
    }

    // Desactivar anteriores asignaciones del ticket
    await queryRunner.manager.update(
      AssignedUserTicket,
      { ticketId, state: true },
      { state: false }
    );

    // Crear nueva asignación
    const assignedUserTicket = queryRunner.manager.create(
      AssignedUserTicket,
      {
        ...dto,
        state: true,
      }
    );

    const savedAssignedUserTicket = await queryRunner.manager.save(
      assignedUserTicket
    );

    await queryRunner.commitTransaction();

    // Email fuera de la transacción
    const userData = await this.getUserById(userId);
    const ticketData = await this.getTicketById(ticketId);

    const emailData = {
      fullname: `${userData.name} ${userData.lastname}` || 'User',
      ticketState: ticketData.ticketState.description,
      prefix: ticketData.ticketTitle.ticketCategory.prefix,
      ticketId: ticketData.id,
      ticketNumber: ticketData.ticketNumber,
      ticketTitle: ticketData.ticketTitle.description,
      ticketPriority: ticketData.ticketTitle.ticketPriority.title,
      estimatedTime: `${ticketData.ticketTitle.ticketPriority.hoursResponse} horas`,
      ticketCreatedAt: ticketData.createdAt,
    };

    let emailStatus = 'Ticket reasignado exitosamente';
    try {
      const company = await this.userService.findById(userData.companyId);
      let to = userData.email;
      if (company?.email) {
        to = `${userData.email},${company.email}`;
      }

      await this.emailService.sendEmail(
        to,
        `Reasignación ${emailData.prefix}-${emailData.ticketNumber}`,
        'email-template-assigned.html',
        emailData
      );
    } catch (error) {
      emailStatus =
        'El ticket se reasignó correctamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico.';
    }

    await this.cacheManager.delCache('assignedUserTickets:*');

    return {
      data: savedAssignedUserTicket,
      message: emailStatus,
    };
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(
      `Error creating AssignedUserTicket: ${error.message}`
    );
  } finally {
    await queryRunner.release();
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
        .leftJoinAndSelect('assignedUserTicket.ticket', 'ticket');

      if (filter) {
        query.where(
          'user.name LIKE :filter OR user.email LIKE :filter OR ticket.title LIKE :filter OR ticket.code LIKE :filter',
          { filter: `%${filter}%` },
        );
      }
      query.skip(skip).take(take);
      const [assignedUserTickets, total] = await query.getManyAndCount();

      const result = {
        data: assignedUserTickets,
        total,
        message: 'Assigned User Tickets List',
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching AssignedUserTickets: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<AssignedUserTicket> {
    try {
      const cacheKey = `assignedUserTicket:${id}`;
      const cachedAssignedUserTicket =
        await this.cacheManager.getCache<AssignedUserTicket>(cacheKey);
      if (cachedAssignedUserTicket) return cachedAssignedUserTicket;

      const assignedUserTicket = await this.getAssignedUserTicketById(id);
      await this.cacheManager.setCache(cacheKey, assignedUserTicket, CACHE_TTL);
      return assignedUserTicket;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching AssignedUserTicket with id ${id}: ${error.message}`,
      );
    }
  }

  async findByTicketId(ticketId: string): Promise<AssignedUserTicket[]> {
    try {
      const cacheKey = `assignedUserTickets:ticket:${ticketId}`;
      const cachedData =
        await this.cacheManager.getCache<AssignedUserTicket[]>(cacheKey);
      if (cachedData) return cachedData;

      await this.getTicketById(ticketId); // Validar que el ticket existe

      const assignedUserTickets = await this.assignedUserTicketRepository.find({
        where: { ticketId },
        relations: ['user'],
      });

      await this.cacheManager.setCache(
        cacheKey,
        assignedUserTickets,
        CACHE_TTL,
      );
      return assignedUserTickets;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching AssignedUserTickets for ticket ${ticketId}: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    dto: UpdateAssignedUserTicketDto,
  ): Promise<AssignedUserTicket> {
    try {
      const existingAssignedUserTicket =
        await this.getAssignedUserTicketById(id);

      if (dto.userId) {
        const agente = await this.getUserById(dto.userId);

        const lastState = await this.ticketStateService.findLastTicketState();

        if (agente?.limite_ticket) {
          const ticketsAsignados = await this.assignedUserTicketRepository
            .createQueryBuilder('assigned')
            .innerJoin('assigned.ticket', 'ticket')
            .innerJoin('ticket.ticketState', 'state')
            .where('assigned.userId = :userId', { userId: agente.id })
            .andWhere('assigned.state = true')
            .andWhere('state.id != :cerradoStateId', {
              cerradoStateId: lastState.id,
            })
            .getCount();

          if (ticketsAsignados >= agente.limite_ticket) {
            throw new BadRequestException(
              `El agente ${agente.name} ha alcanzado su límite de tickets activos (${agente.limite_ticket}).`,
            );
          }
        }
      }

      if (dto.ticketId) {
        await this.getTicketById(dto.ticketId); // Validar que el nuevo ticket existe
      }

      const updatedAssignedUserTicket =
        await this.assignedUserTicketRepository.save({
          ...existingAssignedUserTicket,
          ...dto,
        });

      await this.cacheManager.delCache(`assignedUserTicket:${id}`);
      await this.cacheManager.delCache('assignedUserTickets:*');
      return updatedAssignedUserTicket;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating AssignedUserTicket with id ${id}: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.getAssignedUserTicketById(id);
      await this.assignedUserTicketRepository.softDelete(id);

      await this.cacheManager.delCache(`assignedUserTicket:${id}`);
      await this.cacheManager.delCache('assignedUserTickets:*');
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting AssignedUserTicket with id ${id}: ${error.message}`,
      );
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

  // private async getTicketById_(ticketId: string): Promise<Ticket> {
  //   const ticket = await this.ticketRepository.findOne({
  //     where: { id: ticketId },
  //   });
  //   if (!ticket)
  //     throw new NotFoundException(`Ticket with id ${ticketId} not found`);
  //   return ticket;
  // }

  private async getTicketById(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: {
        ticketState: true,
        ticketTitle: {
          ticketCategory: true,
          ticketPriority: true,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${ticketId} not found`);
    }

    return ticket;
  }

  private async getAssignedUserTicketById(
    id: string,
  ): Promise<AssignedUserTicket> {
    const assignedUserTicket = await this.assignedUserTicketRepository.findOne({
      where: { id },
      relations: ['user', 'ticket'],
    });
    if (!assignedUserTicket)
      throw new NotFoundException(`AssignedUserTicket with id ${id} not found`);
    return assignedUserTicket;
  }

  private async ensureAssignmentDoesNotExist(userId: string, ticketId: string) {
    const exist = await this.assignedUserTicketRepository.findOne({
      where: { userId, ticketId, state: true },
    });
    if (exist) {
      throw new BadRequestException(`El usuario ya está asignado al ticket`);
    }
  }
}
