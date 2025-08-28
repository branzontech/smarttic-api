import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
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
import { TicketFile } from '../ticket-files/entities/ticket-file.entity';
import { AssignedTicketDetailFile } from '../assigned-ticket-detail-file/entities/assigned-ticket-detail-file.entity';
import { WebsocketService } from 'src/common/websocket/websocket.service';

@Injectable()
export class TicketDetailService {
  constructor(
    @InjectRepository(TicketDetail)
    private readonly ticketDetailRepository: Repository<TicketDetail>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketFile)
    private readonly ticketFile: Repository<TicketFile>,
    @InjectRepository(AssignedTicketDetailFile)
    private readonly assignedTicketDetailFile: Repository<AssignedTicketDetailFile>, 
    private readonly websocketService: WebsocketService,    
    private readonly ticketStateService: TicketStateService,
    private readonly ticketService: TicketService,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createTicketDetailDto: CreateTicketDetailDto,
  ): Promise<{ data: TicketDetail; message: string }> {
    const queryRunner =
      this.ticketDetailRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const { ticketId } = createTicketDetailDto;

      // Verificar si existe un TicketDetail asociado al ticketId
      const existingDetail = await queryRunner.manager.findOne(TicketDetail, {
        where: { ticketId },
      });

      // Si NO existe, cambiar el estado del ticket al estado con order 2
      const newState = await this.ticketStateService.findByOrder(2);
      if (!existingDetail) {
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
      let infoFiles: any[] = [];
      if (createTicketDetailDto.infoFiles) {
        try {
          if (typeof createTicketDetailDto.infoFiles === "string") {
            infoFiles = JSON.parse(createTicketDetailDto.infoFiles);
          } else {
            infoFiles = createTicketDetailDto.infoFiles;
          }
        } catch (err) {
          console.error("Error parseando infoFiles:", err);
          infoFiles = [];
        }
      }

      if (infoFiles.length > 0) {
        for (const fileInfo of infoFiles) {
          const ticketFile = this.ticketFile.create({
            fileName: fileInfo.fileName,
            fileType: fileInfo.fileType,
            fileExtension: fileInfo.fileExtension ?? null,
            fileSize: fileInfo.fileSize,
          });
          await queryRunner.manager.save(ticketFile);

          const assignedTicketFile = this.assignedTicketDetailFile.create({
            fileId: ticketFile.id,
            ticketDetailId: savedDetail.id,
          });
          await queryRunner.manager.save(assignedTicketFile);
        }
      }

      const resultData = await this.ticketService.findOne(ticketId);
      const user = await this.userService.findById(resultData.userId);
      if (!user) {
        throw new NotFoundException(`Error finding ticket user.`);
      }

      await queryRunner.commitTransaction();
      this.websocketService.emit('ticketDetail-saved', savedDetail, ticketId); 
      this.websocketService.emit('tickets-updated', savedDetail);
      let emailStatus = 'Ticket created successfully';
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;

      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: newState.title,
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
          emailData,
        );
      } catch (emailError) {
        console.log('emailError', emailError);
        emailStatus =
          'Ticket was created successfully, but the email notification could not be sent. Please contact Branzon Tech support';
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

      queryBuilder
        .orderBy('ticketDetail.createdAt', 'DESC')
        .skip(skip)
        .take(take);

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

      
      const ticket = await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.ticketFiles', 'ticketFiles')        
        .leftJoinAndSelect('ticketFiles.file', 'file')
        .leftJoinAndSelect('ticket.notes', 'notes')
        .leftJoinAndSelect('ticket.formResponse', 'formResponse')
        .leftJoinAndSelect('formResponse.form', 'form')
        .leftJoinAndSelect('form.fields', 'fields')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticket.user', 'user')
        .leftJoinAndSelect('ticket.surveyResponses', 'surveyResponses')        
        .leftJoinAndSelect('surveyResponses.surveyCalification', 'surveyCalification')        
        .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers', 'assignedUsers.state = true')
        .leftJoinAndSelect('user.branch', 'branch')
        .leftJoinAndSelect('assignedUsers.user', 'agent')
        // .where('ticket.id = :ticketId AND assignedUsers.state = true', {
        .where('ticket.id = :ticketId', {
          ticketId,
        })
        .getOne();

      if (!ticket) {
        throw new NotFoundException(
          `Ticket con ID '${ticketId}' no encontrado.`,
        );
      }

      
      const details = await this.ticketDetailRepository
        .createQueryBuilder('detail')
        .leftJoinAndSelect('detail.ticketDetailFiles', 'ticketDetailFiles')
        .leftJoinAndSelect('ticketDetailFiles.file', 'file')
        .leftJoinAndSelect('detail.user', 'user')
        .leftJoinAndSelect('user.role', 'role')
        .where('detail.ticketId = :ticketId', { ticketId })
        .orderBy('detail.createdAt', 'ASC')
        .getMany();

     
      const formattedTicket: any = {
        id: ticket.id,
        type: 'ticket',
        description: ticket.description || `Ver Detalles en formulario : ${ticket.formResponse.form.name}` || '',
        ticketId: ticket.id,
        userId: ticket.user?.id || '',
        userImageName: ticket.user?.profileImageName,
        userName: ticket.user?.companyname?.trim()
          ? ticket.user.companyname
          : `${ticket.user?.name || ''} ${ticket.user?.lastname || ''}`.trim(),  
        files: ticket.ticketFiles.map(tf => tf.file) || [],
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
        userImageName: detail.user?.profileImageName,
        userName: detail.user?.companyname?.trim()
          ? detail.user.companyname
          : `${detail.user?.name || ''} ${detail.user?.lastname || ''}`.trim(),
        isMessageAgent: detail.user.role.isAgent,
        files: detail.ticketDetailFiles.map(tf => tf.file) || [],
        state: detail.state,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      }));

      let formattedForm: any = null;

      if (
        ticket.formResponse &&
        ticket.formResponse.form &&
        ticket.formResponse.responses
      ) {
        const form = ticket.formResponse.form;

        formattedForm = {
          id: form.id,
          name: form.name,
          description: form.description,
          fields: form.fields.map((field) => ({
            label: field.label,
            fieldKey: field.fieldKey,
            type: field.type,
            value: ticket.formResponse.responses[field.fieldKey] ?? null,
          })),
        };
      }

      const result = {
        data: {
          formResponse: formattedForm,
          notes: ticket.notes,
          user:ticket.user,
          agent:ticket.assignedUsers && ticket.assignedUsers.length>0 ? ticket.assignedUsers[0].user : null,
          surveyResponses:ticket.surveyResponses,
          ticketState: ticket.ticketState,
          ticketStateOrder: ticket.ticketState?.orderTicket || 1,
          ticketTitle: ticket.ticketTitle,
          ticketPriority: ticket.ticketTitle?.ticketPriority.title || '',
          details: [formattedTicket, ...formattedDetails],
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error en findTicketAndDetailsById:', error);
      if (error instanceof HttpException) {
        throw error;
      }
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
