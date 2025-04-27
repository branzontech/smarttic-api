import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { TicketDetail } from './entities/ticket-detail.entity';
import { CreateTicketDetailDto } from './dto/create-ticket-detail.dto';
import { UpdateTicketDetailDto } from './dto/update-ticket-detail.dto';
import { CACHE_TTL } from 'src/common/constants';
import { Ticket } from '../ticket/entities/ticket.entity';
import { TicketStateService } from '../ticket-state/ticket-state.service';
import { TicketService } from '../ticket/ticket.service';
import { UsersService } from '../users/users.service';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class TicketDetailService {
  constructor(
    @InjectRepository(TicketDetail)
    private readonly ticketDetailRepository: Repository<TicketDetail>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketStateService: TicketStateService,
    private readonly ticketService: TicketService,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createTicketDetailDto: CreateTicketDetailDto,
  ): Promise<{data: TicketDetail, message: string}> {
    const queryRunner = this.ticketDetailRepository.manager.connection.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      const { ticketId } = createTicketDetailDto;
  
      // Verificar si existe un TicketDetail asociado al ticketId
      const existingDetail = await queryRunner.manager.findOne(TicketDetail, {
        where: { ticketId },
      });
  
      // Si NO existe, cambiar el estado del ticket al estado con order 2
      if (!existingDetail) {
        const newState = await this.ticketStateService.findByOrder(2);
        
        if (!newState) {
          throw new Error('No se encontró un estado con order 2.');
        }
  
        await queryRunner.manager.update(
          Ticket,
          { id: ticketId },
          { ticketStateId: newState.id },
        );
      }
  
      // Crear y guardar el nuevo TicketDetail
      const detail = queryRunner.manager.create(
        TicketDetail,
        createTicketDetailDto,
      );
      const savedDetail = await queryRunner.manager.save(detail);
  
      const resultData = await this.ticketService.findOne(ticketId);
      const user = await this.userService.findById(resultData.userId);
      if (!user) {
        throw new NotFoundException(`Error finding ticket user.`);
      }
  
      await queryRunner.commitTransaction();
  
      let emailStatus = 'Ticket created successfully';
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;
      
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
          `Actualizado ${prefix}-${resultData.ticketNumber}`,
          'email-template.html',
          emailData
        );
      } catch (emailError) {
        console.log("emailError", emailError)
        emailStatus = 'Ticket was created successfully, but the email notification could not be sent. Please contact Branzon Tech support';
      }
  
      // Limpiar cache después de la transacción
      await this.cacheManager.delCache(`ticketDetails:*`);
  
      return { data: savedDetail, message: emailStatus };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('Error en create:', error);
      throw new InternalServerErrorException(
        'No se pudo crear el detalle de ticket.',
      );
    } finally {
      if (queryRunner.isReleased === false) {
        await queryRunner.release();
      }
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: TicketDetail[]; total: number }> {
    try {
      const cacheKey = `ticketDetails:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{
        data: TicketDetail[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const queryBuilder =
        this.ticketDetailRepository.createQueryBuilder('ticketDetail');

      if (filter) {
        queryBuilder.where('ticketDetail.description ILIKE :filter', {
          filter: `%${filter}%`,
        });
      }

      queryBuilder.skip(skip).take(take);

      const [details, total] = await queryBuilder.getManyAndCount();

      const result = { data: details, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException('Failed to fetch ticket details.');
    }
  }

  async findOne(id: string): Promise<TicketDetail> {
    try {
      const cacheKey = `ticketDetail:${id}`;
      let detail = await this.cacheManager.getCache<TicketDetail>(cacheKey);

      if (!detail) {
        detail = await this.ticketDetailRepository.findOne({ where: { id } });
        if (!detail) {
          throw new NotFoundException(
            `Detalle de ticket con ID '${id}' no encontrado.`,
          );
        }
        await this.cacheManager.setCache(cacheKey, detail);
      }

      return detail;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el detalle de ticket.',
      );
    }
  }

  async findTicketAndDetailsById(ticketId: string) {
    try {
      const cacheKey = `ticketWithDetailsArray:${ticketId}`;
      const cached = await this.cacheManager.getCache<{ data: any[] }>(
        cacheKey,
      );

      if (cached) return cached;

      // 1. Obtener el ticket con relaciones
      const ticket = await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticket.user', 'user')
        .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers')
        .leftJoinAndSelect('assignedUsers.user', 'agent')
        .where('ticket.id = :ticketId', { ticketId })
        .getOne();

      if (!ticket) {
        throw new NotFoundException(
          `Ticket con ID '${ticketId}' no encontrado.`,
        );
      }

      // 2. Obtener los detalles ordenados
      const details = await this.ticketDetailRepository
        .createQueryBuilder('detail')
        .leftJoinAndSelect('detail.user', 'user')
        .where('detail.ticketId = :ticketId', { ticketId })
        .orderBy('detail.createdAt', 'ASC')
        .getMany();

      // 2. Obtener los detalles ordenados
      // 3. Formatear el ticket principal
      const formattedTicket: any = {
        id: ticket.id,
        type: 'ticket',
        description: ticket.description || '',
        ticketId: ticket.id,
        userId: ticket.user?.id || '',
        user: ticket.user?.companyname?.trim()
          ? ticket.user.companyname
          : `${ticket.user?.name || ''} ${ticket.user?.lastname || ''}`.trim(),
        state: true,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      };

      // 4. Formatear los detalles
      const formattedDetails: any[] = details.map((detail) => ({
        id: detail.id,
        type: 'detail',
        description: detail.description,
        ticketId: detail.ticketId,
        userId: detail.user?.id || '',
        user: detail.user?.companyname?.trim()
          ? detail.user.companyname
          : `${detail.user?.name || ''} ${detail.user?.lastname || ''}`.trim(),
        state: detail.state,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      }));

      const result = {
        data: {
          user: ticket.user?.companyname?.trim()
            ? ticket.user.companyname
            : `${ticket.user?.name || ''} ${ticket.user?.lastname || ''}`.trim(),
          ticketState: ticket.ticketState?.title || '',
          ticketStateOrder: ticket.ticketState?.orderTicket || 1,
          ticketTitle: ticket.ticketTitle?.description || '',
          ticketPriority: ticket.ticketTitle?.ticketPriority.title || '',
          agent:
            `${ticket.assignedUsers[0]?.user?.name || ''} ${ticket.assignedUsers[0]?.user?.lastname || ''}`.trim(),
          agentId: ticket.assignedUsers[0]?.user?.id || '',
          details: [formattedTicket, ...formattedDetails],
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error en findTicketAndDetailsById:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el ticket con sus detalles.',
      );
    }
  }

  async update(
    id: string,
    updateTicketDetailDto: UpdateTicketDetailDto,
  ): Promise<TicketDetail> {
    try {
      const detail = await this.ticketDetailRepository.preload({
        id,
        ...updateTicketDetailDto,
      });

      if (!detail) {
        throw new NotFoundException(
          `Detalle de ticket con ID '${id}' no encontrado.`,
        );
      }

      const updatedDetail = await this.ticketDetailRepository.save(detail);
      await this.cacheManager.delCache(`ticketDetail:${id}`);
      await this.cacheManager.delCache(`ticketDetails:*`);

      return updatedDetail;
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el detalle de ticket.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const detail = await this.ticketDetailRepository.findOne({
        where: { id },
      });

      if (!detail) {
        throw new NotFoundException(
          `Detalle de ticket con ID '${id}' no encontrado.`,
        );
      }

      await this.ticketDetailRepository.softDelete(id);
      await this.cacheManager.delCache(`ticketDetail:${id}`);
      await this.cacheManager.delCache(`ticketDetails:*`);
    } catch (error) {
      console.error('Error en remove:', error);
      throw new InternalServerErrorException(
        'No se pudo eliminar el detalle de ticket.',
      );
    }
  }
}
