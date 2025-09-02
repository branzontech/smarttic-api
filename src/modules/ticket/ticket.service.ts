import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CACHE_TTL } from 'src/common/constants';
import { TicketStateService } from '../ticket-state/ticket-state.service';
import { EmailService } from 'src/common/email/email.service';
import {
  userSession,
  DashboardChartGroupBar,
  columnDataFilter,
  columnDataOrder,
} from 'src/common/types';
import { UsersService } from '../users/users.service';
import { AssignedUserTicket } from '../assigned-user-ticket/entities/assigned-user-ticket.entity';
import { SurveyResponse } from '../survey-response/entities/survey-response.entity';
import { FormResponse } from '../form-responses/entities/form-response.entity';
import { FormResponseFile } from '../form-response-files/entities/form-response-file.entity';
import { TicketState } from '../ticket-state/entities/ticket-state.entity';
import { User } from '../users/entities/user.entity';
import { TicketTitleService } from '../ticket-title/ticket-title.service';
import { NoteAgentTicket } from '../note-agent-tickets/entities/note-agent-ticket.entity';
import { calculateBusinessMinutesBetweenDates } from '../../common/helpers/business-time.util';
import { LaborHoursService } from '../labor-hours/labor-hours.service';
import { HolidaysService } from '../holidays/holidays.service';
import { TicketFile } from '../ticket-files/entities/ticket-file.entity';
import { AssignedTicketFile } from '../assigned-ticket-file/entities/assigned-ticket-file.entity';
import { WebsocketService } from 'src/common/websocket/websocket.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(FormResponse)
    private readonly formResponseRepository: Repository<FormResponse>,
    @InjectRepository(FormResponseFile)
    private readonly formResponseFilesRepository: Repository<FormResponseFile>,
    @InjectRepository(TicketFile)
    private readonly ticketFile: Repository<TicketFile>,
    @InjectRepository(AssignedTicketFile)
    private readonly assignedTicketFile: Repository<AssignedTicketFile>,
    private readonly websocketService: WebsocketService,    
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly cacheManager: CacheManagerService,
    private readonly ticketStateService: TicketStateService,
    private readonly ticketTitleService: TicketTitleService,
    private readonly laborHoursService: LaborHoursService,
    private readonly holidaysService: HolidaysService,
  ) {}

  async create(
    createTicketDto: Partial<CreateTicketDto>,
    user: userSession,
    files: Express.Multer.File[],
  ): Promise<{ data: Ticket; message: string }> {
    const queryRunner = this.ticketRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      if (!user?.id) throw new BadRequestException('Usuario no autenticado');
      if (!createTicketDto.ticketTitleId) {
        throw new BadRequestException('El título del ticket es obligatorio');
      }

      const manager = queryRunner.manager;

      const [firstState, initialState, lastState] = await Promise.all([
        this.ticketStateService.findFirstTicketState(manager),
        this.ticketStateService.findInitialPreapprovalTicketState(manager),
        this.ticketStateService.findLastTicketState(manager),
      ]);

      if (!firstState) {
        throw new NotFoundException('No se encontró el estado inicial del ticket');
      }

      const hasPreapprovalInCategory = await this.ticketTitleService.hasPreapprovalInCategory(
        createTicketDto.ticketTitleId,
        manager,
      );

      const branchId = user.role.isAdmin || user.role.isConfigurator || user.role.isAgent
        ? createTicketDto.branchId
        : user.branchId;

      if (!branchId) {
        throw new BadRequestException('El ticket no tiene sucursal asignada');
      }

      
      let selectedAgent: User | null = null;

      if (hasPreapprovalInCategory) {
        selectedAgent = await this.userService.findDesignatedApproverAgent(branchId, manager);
      } else {
        selectedAgent = await this.agentAssigned(branchId, lastState.id, manager);
      }

      
      const {
        formResponse: formResponseData,
        assignedUsers,
        ...ticketBaseData
      } = createTicketDto;

      const ticket = this.ticketRepository.create({
        ...ticketBaseData,
        userId: user.id,
        branchId,
        ticketStateId: hasPreapprovalInCategory ? initialState.id : firstState.id,
      });

      const savedTicket = await manager.save(ticket);

     
      if (
        formResponseData &&
        formResponseData.formId?.trim() &&
        formResponseData.responses &&
        Object.keys(formResponseData.responses).length > 0
      ) {
        const formResponse = this.formResponseRepository.create({
          ...formResponseData,
          ticketId: savedTicket.id,
        });

        await manager.save(formResponse);

        if (files?.length > 0) {
          for (const file of files) {
            const fileEntity = this.formResponseFilesRepository.create({
              formResponseId: formResponse.id,
              fieldKey: file.fieldname,
              filename: file.filename,
              originalName: file.originalname,
            });

            await manager.save(fileEntity);
          }
        }

        savedTicket.formResponse = formResponse;
        await manager.save(Ticket, savedTicket); 
      }

      if (createTicketDto.files?.length > 0) {
        for (const fileInfo of createTicketDto.files) {
          const ticketFile = this.ticketFile.create({
            fileName :fileInfo.fileName,
            fileType: fileInfo.fileType,
            fileExtension: fileInfo.fileExtension,
            fileSize: fileInfo.fileSize,
          });
          await manager.save(ticketFile);
         
          const assignedTicketFile = this.assignedTicketFile.create({
            fileId: ticketFile.id,
            ticketId: savedTicket.id,
          });
          await manager.save(assignedTicketFile);            
          
        }
      }

     
      const assignedUserId = user.role.isAgent ? user.id : selectedAgent?.id;

      if (assignedUserId) {
        const assigned = this.assignedUserTicketRepository.create({
          userId: assignedUserId,
          ticketId: savedTicket.id,
        });
        await manager.save(assigned);
      }

      
      await queryRunner.commitTransaction();

     

      const resultData = await this.findOne(savedTicket.id);
      this.websocketService.emit('ticket-saved', resultData);
      let emailStatus = 'Ticket creado exitosamente';
      const emailErrors: string[] = [];

      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: hasPreapprovalInCategory ? initialState.description :firstState.description,
          prefix: resultData.ticketTitle.ticketCategory.prefix,
          ticketId: resultData.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: resultData.ticketTitle.ticketPriority.title,
          estimatedTime: `${resultData.ticketTitle.ticketPriority.hoursResponse} horas`,
          ticketCreatedAt: resultData.createdAt,
        };

        const templace_email = hasPreapprovalInCategory ? 'email-template-pending.html' : 'email-template-open.html';

        // Envío al usuario
        try {
          await this.emailService.sendEmail(
            user.email,
            `${emailData.prefix}-${resultData.ticketNumber}`,
            templace_email,
            emailData,
          );
        } catch (userEmailError) {
          console.error('Error al enviar correo al usuario:', userEmailError);
          emailErrors.push(`Usuario (${user.email}): ${userEmailError.message}`);
        }

        const company = user.companyId
          ? await this.userService.findCompanyById(user.companyId)
          : null;

        
        try {
          if (selectedAgent?.email) {
            emailData.fullname = `${selectedAgent.name} ${selectedAgent.lastname}`;
            const recipients = `${selectedAgent.email}${company?.email ? ',' + company.email : ''}`;

            await this.emailService.sendEmail(
              recipients,
              `Asignación ${emailData.prefix}-${resultData.ticketNumber}`,
              'email-template-assigned.html',
              emailData,
            );
          } 
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Agente: ${agentEmailError.message}`);
        }

        try {
          if (company?.email) {
            await this.emailService.sendEmail(
              company.email,
              `Asignación ${emailData.prefix}-${resultData.ticketNumber}`,
              'email-template-assigned.html',
              emailData,
            );
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Empresa: ${agentEmailError.message}`);
        }

        if (emailErrors.length > 0) {
          emailStatus = `El ticket se creó correctamente, pero ocurrieron errores al enviar correos: ${emailErrors.join(
            ' | ',
          )}`;
        }

      } catch (emailError) {
        console.error("Error general en bloque de envío de correos:", emailError);
        if (emailErrors.length > 0) {
           emailStatus = `El ticket se creó correctamente, pero ocurrieron errores al enviar correos: ${emailErrors.join(
            ' | ',
          )}`;
        }
      }

      await this.cacheManager.delCache('tickets:*');

      return {
        data: resultData,
        message: emailStatus,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Se produjo un error al crear el ticket: ${error?.message || 'Error inesperado'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    user: userSession,
    search?: string, 
    stateId?: string, 
    priorityId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      const { isAdmin, isAgent, isConfigurator } = user.role;
      const isClient = !isAdmin && !isAgent && !isConfigurator;
      const cacheKey = `tickets:userId:${user.id}:search:${search}:stateId:${stateId}
      :priorityId:${priorityId}:branchId:${branchId}:startDate:${startDate}:endDate:${endDate}`;
      const cachedData = await this.cacheManager.getCache<{
        data: Ticket[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const queryBuilder = this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.surveyResponses', 'surveyResponses')        
        .leftJoinAndSelect('surveyResponses.surveyCalification', 'surveyCalification') 
        .leftJoinAndSelect('ticket.formResponse', 'formResponse')
        .leftJoinAndSelect('formResponse.form', 'form')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticket.user', 'user')
        .leftJoinAndSelect('ticket.branch', 'branch')
        .leftJoinAndSelect('user.company', 'company')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')

        if (user.isDesignatedApprover) {
          queryBuilder .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers')       
        }else{
          queryBuilder .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers', 'assignedUsers.state = true')
        }
        queryBuilder.leftJoinAndSelect('assignedUsers.user', 'agent')
       

      // Filtro por rol
      if (!isConfigurator) {
        if (isClient) {
          queryBuilder.andWhere('ticketState.isInitialPreapproval = false ');
          queryBuilder.andWhere(
            'ticket.userId = :userId',
            { userId: user.id },
          );
        }
        if (isAgent) {
          queryBuilder.andWhere(
              'assignedUsers.userId = :agentId',
              {
                agentId: user.id,
              },
            );
          
        }
        if (isAdmin) {
          queryBuilder.andWhere(
            'user.companyId = :userId',
            {
              userId: user.id,
            },
          );
        }
      }

      // Filtro por texto de búsqueda
      if (search) {
        const conditions: string[] = [];

        // Campos visibles por todos
        conditions.push(
          `CONCAT(ticketCategory.prefix,'-', "ticket"."ticketNumber") ILIKE :search`,
          'ticketTitle.description ILIKE :search',
          'ticketPriority.title ILIKE :search',
          'ticketState.title ILIKE :search',
          'agent.name ILIKE :search',
          'agent.lastname ILIKE :search',
        );

        if (!isClient) {
          conditions.push(
            'user.name ILIKE :search',
            'user.lastname ILIKE :search',
          );
        }

        if (isConfigurator) {
          conditions.push('company.companyname ILIKE :search');
        }

        if (isConfigurator || isAdmin) {
          conditions.push('branch.name ILIKE :search');
        }

        queryBuilder.andWhere(`(${conditions.join(' OR ')})`, {
          search: `%${search}%`,
        });
      }

      // Filtro por estado
      if (stateId && stateId !== 'all') {
        let ticketStateId = stateId;
        let condition = 'ticket.ticketStateId = :ticketStateId';
        if (stateId==='active') {
          const lastState = await this.ticketStateService.findLastTicketState();
          if (!lastState) {
            throw new NotFoundException(`Error al encontrar el ultimo estado.`);
          }
          ticketStateId=lastState.id;
          condition = 'ticket.ticketStateId <> :ticketStateId';
        }
        queryBuilder.andWhere(condition, { ticketStateId });
      }

      // Filtro por prioridad
      if (priorityId) {
        queryBuilder.andWhere('ticket.ticketPriorityId = :priorityId', { priorityId });
      }

      // Filtro por sucursal
      if (branchId) {
        queryBuilder.andWhere('ticket.branchId = :branchId', { branchId });
      }

      // Filtro por rango de fechas
      if (startDate && endDate) {
        queryBuilder.andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

     

      queryBuilder.orderBy('ticket."createdAt"', "DESC");

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
        const queryBuilder = this.ticketRepository
          .createQueryBuilder('ticket')
          .leftJoinAndSelect('ticket.formResponse', 'formResponse')
          .leftJoinAndSelect('formResponse.form', 'form')
          .leftJoinAndSelect('ticket.ticketState', 'ticketState')
          .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
          .leftJoinAndSelect('ticket.user', 'user')
          .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
          .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
          .leftJoinAndSelect(
            'ticket.assignedUsers',
            'assignedUsers',
            'assignedUsers.state = true',
          )
          .leftJoinAndSelect('assignedUsers.user', 'agent')
          .where('ticket.id = :id', { id });

        ticket = await queryBuilder.getOne();

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

  async findAgentApprover(id: string): Promise<Ticket> {
    try {
      const cacheKey = `ticket:Agent-Approver-${id}`;
      let ticket = await this.cacheManager.getCache<Ticket>(cacheKey);

      if (!ticket) {
        const queryBuilder = this.ticketRepository
          .createQueryBuilder('ticket')
          .leftJoinAndSelect(
            'ticket.assignedUsers',
            'assignedUsers',
            'assignedUsers.state = false',
          )
          .leftJoinAndSelect('assignedUsers.user', 'agent', 'agent.isDesignatedApprover = true')
          .where('ticket.id = :id', { id });

        ticket = await queryBuilder.getOne();

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

  async updateStatusToOpen(
    userSession: userSession,
    id: string,
    description: string,
  ): Promise<{ data: Ticket[]; message: string }> {
    const queryRunner = this.ticketRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const updatedTickets: Ticket[] = [];
    const manager = queryRunner.manager;
    const emailErrors: { ticketId: string; email:string, error: any }[] = [];

    try {
      const ticketFirstState = await this.ticketStateService.findFirstTicketState(manager);
      if (!ticketFirstState) {
        throw new NotFoundException(`Error al encontrar el primer estado.`);
      }
      const firstState = await this.ticketStateService.findFirstTicketState(manager);
      if (!firstState) {
        throw new NotFoundException(`Error al encontrar el primer estado.`);
      }

        const note = manager.create(NoteAgentTicket, {
          description,
          userId: userSession.id,
          ticketId: id,
        });
        await manager.save(note);

        const ticket = await manager.preload(Ticket, {
          id,
          ticketStateId: ticketFirstState.id,
        });

        if (!ticket) {
          throw new NotFoundException(`No se encontró el ticket con ID '${id}'.`);
        }

        const updatedTicket = await manager.save(ticket);
        

        const existingAssignment = await manager.findOne(AssignedUserTicket, {
          where: {
            userId: userSession.id,
            ticketId: id,
          },
        });

        if (existingAssignment) {
          existingAssignment.state = false;
          await manager.save(existingAssignment);
        }
        const selectedAgent = await this.agentAssigned(updatedTicket.branchId, firstState.id, manager);
        const assignedUserId = selectedAgent?.id;
        if (assignedUserId) {
          const assigned =manager.create(AssignedUserTicket, {
            userId: assignedUserId,
            ticketId: updatedTicket.id,
          });
          await manager.save(assigned);
        }
         
      
      await queryRunner.commitTransaction();
     
        const resultData = await this.findOne(id);
        this.websocketService.emit('ticket-toOpen', resultData);
        const user = await this.userService.findById(resultData.userId);
     

        const prefix = resultData.ticketTitle.ticketCategory.prefix;
        const priority = resultData.ticketTitle.ticketPriority.title;

        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: resultData.ticketState.description,
          prefix,
          ticketId: resultData.id,
          userId: user.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };

        try {
          await this.emailService.sendEmail(
            user.email,
            `Actualización ${prefix}-${resultData.ticketNumber}`,
            'email-template-open.html',
            emailData,
            true,
          );

          const lastState = await this.ticketStateService.findLastTicketState(manager);
          const selectedAgent = await this.agentAssigned(ticket.branchId, lastState.id, manager);   

          if (selectedAgent?.email) {
            const company = await this.userService.findCompanyById(user.companyId);
            emailData.fullname = `${selectedAgent.name} ${selectedAgent.lastname}`;

            await this.emailService.sendEmail(
              `${selectedAgent.email}${company?.email ? ',' + company.email : ''}`,
              `Apertura ticket ${prefix}-${resultData.ticketNumber}`,
              'email-template-assigned.html',
              emailData,
            );
          }
        } catch (emailError) {
          console.error('Error enviando email para ticket:', ticket.id, emailError);
          emailErrors.push({ ticketId: ticket.id, email:user.email, error: emailError });
        }

        await this.cacheManager.delCache(`ticket:${ticket.id}`);
      // }

      await this.cacheManager.delCache('tickets:*');
      await this.cacheManager.delCache('notes:*');

      let message = 'Ticket abierto correctamente.';

      // if (emailErrors.length === ids.length) {
      //   message += ' Sin embargo, **ningún correo fue enviado exitosamente**.';
      // } else if (emailErrors.length > 0) {
      //   message += ` Algunos correos **fallaron** (${emailErrors.length}/${ids.length}).`;
      // }

      // Detallar errores si los hay
      if (emailErrors.length > 0) {
        const errorDetails = emailErrors
          .map(
            (error) =>
              `\n- Ticket ID: ${error.ticketId}, Correo: ${error.email}, Motivo: ${error.error.message}` 
          )
          .join('');
        message += '\n\n**Errores de envío:**' + errorDetails;
      }

      return {
        data: updatedTickets,
        message,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in updateStatusToOpen:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Se produjo un error al crear el ticket: ${error?.message || 'Error inesperado'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatusToInProcess(
    id: string,
  ): Promise<{ data: Ticket; message: string }> {
    try {
      // Find the state with order 3
      const ticketState = await this.ticketStateService.findByOrder(2);
      if (!ticketState) {
        throw new NotFoundException(`Estado con orden '2' no encontrado.`);
      }

      // Preload to update
      const ticket = await this.ticketRepository.preload({
        id,
        ticketStateId: ticketState.id,
      });

      if (!ticket) {
        throw new NotFoundException(`No se encontró el ticket con ID '${id}'.`);
      }

      const updatedTicket = await this.ticketRepository.save(ticket);

      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(
          `Error al encontrar el usuario del ticket.`,
        );
      }
      const resultData = await this.findOne(updatedTicket.id);
      this.websocketService.emit('ticket-inProcess', resultData);
      let emailStatus = 'El ticket fue pasado a EN PROCESO exitosamente';
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;
      const emailErrors: string[] = [];
      const agent = resultData.assignedUsers ? await this.userService.findById(resultData.assignedUsers[0].userId) : null;
     
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: ticketState.title,
          prefix: prefix,
          ticketNumber: resultData.ticketNumber,
          ticketId: resultData.id,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };
        try {
          await this.emailService.sendEmail(
            user.email,
            `Actualizacion ${prefix}-${updatedTicket.ticketNumber}`,
            'email-template.html',
            emailData,
          );
        } catch (userEmailError) {
          console.error('Error al enviar correo al usuario:', userEmailError);
          emailErrors.push(`Usuario (${user.email}): ${userEmailError.message}`);
        }
        
        try {
          const agentApprover = await this.findAgentApprover(updatedTicket.id);
          if (agentApprover) {
            const name = agentApprover.assignedUsers[0].user.name
            const lastname = agentApprover.assignedUsers[0].user.lastname;
            const email = agentApprover.assignedUsers[0].user.email;
            emailData['fullname'] = name + ' ' + lastname;
            if (email) {
              await this.emailService.sendEmail(
                email,
                `Modificación tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente:', agentEmailError);
          emailErrors.push(`Agente Aprobador: ${agentEmailError.message}`);
        }

        try {
          if (agent) {
             emailData['fullname'] = agent.name + ' ' + agent.lastname;
           
            if (agent.email) {
              await this.emailService.sendEmail(
                agent.email,
                `Modificación tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo a la empresa:', agentEmailError);
          emailErrors.push(`Agente Asignado: ${agentEmailError.message}`);
        }

        try {
          const company = await this.userService.findCompanyById(
            user.companyId,
          );
          emailData['fullname'] = agent.name + ' ' + agent.lastname;
          if (company?.email) {
            await this.emailService.sendEmail(
              company.email,
              `Modificación tikect ${emailData.prefix}-${resultData.ticketNumber}`,
              'email-template-assigned-modify.html',
              emailData,
            );
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al empresa:', agentEmailError);
          emailErrors.push(`Empresa: ${agentEmailError.message}`);
        }

       
      } catch (emailError) {
        console.log(emailError);
         if (emailErrors.length > 0) {
           emailStatus = `El ticket se creó correctamente, pero ocurrieron errores al enviar correos: ${emailErrors.join(
            ' | ',
          )}`;
        }
        // emailStatus =
        //   'El ticket fue pasado a EN PROCESO exitosamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico de Branzon.';
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error('Error in updateStatusToInProces:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del ticket.',
      );
    }
  }

  async updateStatusToAssisted(
    id: string,
  ): Promise<{ data: Ticket; message: string }> {
    try {
      // Find the state with order 3
      const ticketState = await this.ticketStateService.findByOrder(3);
      if (!ticketState) {
        throw new NotFoundException(`Estado con orden '3' no encontrado.`);
      }

      // Preload to update
      const ticket = await this.ticketRepository.preload({
        id,
        ticketStateId: ticketState.id,
      });

      if (!ticket) {
        throw new NotFoundException(`No se encontró el ticket con ID '${id}'.`);
      }

      const updatedTicket = await this.ticketRepository.save(ticket);

      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(
          `Error al encontrar el usuario del ticket.`,
        );
      }
      const resultData = await this.findOne(updatedTicket.id);
      this.websocketService.emit('ticket-toAssisted', resultData);
      let emailStatus = 'El ticket atendido exitosamente';
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;
      const emailErrors: string[] = [];
      const agent = resultData.assignedUsers ? await this.userService.findById(resultData.assignedUsers[0].userId) : null;
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: ticketState.title,
          prefix: prefix,
          ticketNumber: resultData.ticketNumber,
          ticketId: resultData.id,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };
        
        try {
          await this.emailService.sendEmail(
            user.email,
            `Actualizacion ${prefix}-${updatedTicket.ticketNumber}`,
            'email-template.html',
            emailData,
          );
        } catch (userEmailError) {
          console.error('Error al enviar correo al usuario:', userEmailError);
          emailErrors.push(`Usuario (${user.email}): ${userEmailError.message}`);
        }
        
        try {
          const agentApprover = await this.findAgentApprover(updatedTicket.id);
          if (agentApprover) {
            const name = agentApprover.assignedUsers[0].user.name
            const lastname = agentApprover.assignedUsers[0].user.lastname;
            const email = agentApprover.assignedUsers[0].user.email;
            emailData['fullname'] = name + ' ' + lastname;
            if (email) {
              await this.emailService.sendEmail(
                email,
                `Modificación tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Agente Aprobador: ${agentEmailError.message}`);
        }

        try {
          if (agent) {
             emailData['fullname'] = agent.name + ' ' + agent.lastname;
           
            if (agent.email) {
              await this.emailService.sendEmail(
                agent.email,
                `Modificación tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Agente Asignado: ${agentEmailError.message}`);
        }

        try {
          const company = await this.userService.findCompanyById(
            user.companyId,
          );
          emailData['fullname'] = agent.name + ' ' + agent.lastname;
          if (company?.email) {
            await this.emailService.sendEmail(
              company.email,
              `Modificación tikect ${emailData.prefix}-${resultData.ticketNumber}`,
              'email-template-assigned-modify.html',
              emailData,
            );
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Empresa: ${agentEmailError.message}`);
        }
      } catch (emailError) {
        console.log(emailError);
        if (emailErrors.length > 0) {
           emailStatus = `El ticket se creó correctamente, pero ocurrieron errores al enviar correos: ${emailErrors.join(
            ' | ',
          )}`;
        }
        // emailStatus =
        //   'El ticket fue pasado a ATENDIDO exitosamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico de Branzon.';
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error('Error in updateStatusToAssisted:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del ticket.',
      );
    }
  }

  async updateStatusToCloseted(
    id: string,
  ): Promise<{ data: Ticket; message: string }> {
    try {
      const ticketLastState =
        await this.ticketStateService.findLastTicketState();
      if (!ticketLastState) {
        throw new NotFoundException(`Error finding last state.`);
      }

      // Preload to update
      const ticket = await this.ticketRepository.preload({
        id,
        ticketStateId: ticketLastState.id,
      });

      if (!ticket) {
        throw new NotFoundException(`No se encontró el ticket con ID '${id}'.`);
      }

      const updatedTicket = await this.ticketRepository.save(ticket);
      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(
          `Error al encontrar el usuario del ticket.`,
        );
      }
      const resultData = await this.findOne(updatedTicket.id);
      this.websocketService.emit('ticket-closeted', resultData);
      let emailStatus = 'Ticket cerrado con éxito';
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;
      const emailErrors: string[] = [];
      const agent = resultData.assignedUsers ? await this.userService.findById(resultData.assignedUsers[0].userId) : null;
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: resultData.ticketState.description,
          prefix: prefix,
          ticketId: resultData.id,
          userId: user.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };

        try {
          await this.emailService.sendEmail(
            user.email,
            `Cierre tikect ${prefix}-${updatedTicket.ticketNumber}`,
            'email-template-closet.html',
            emailData,
          );
        } catch (userEmailError) {
          console.error('Error al enviar correo al usuario:', userEmailError);
          emailErrors.push(`Usuario (${user.email}): ${userEmailError.message}`);
        }
        
        try {
          const agentApprover = await this.findAgentApprover(updatedTicket.id);
          if (agentApprover) {
            const name = agentApprover.assignedUsers[0].user.name
            const lastname = agentApprover.assignedUsers[0].user.lastname;
            const email = agentApprover.assignedUsers[0].user.email;
            emailData['fullname'] = name + ' ' + lastname;
            if (email) {
              await this.emailService.sendEmail(
                email,
                `Cierre tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Agente Aprobador: ${agentEmailError.message}`);
        }

        try {
          if (agent) {
             emailData['fullname'] = agent.name + ' ' + agent.lastname;
           
            if (agent.email) {
              await this.emailService.sendEmail(
                agent.email,
                `Cierre tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
                'email-template-assigned-modify.html',
                emailData,
              );
            }
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Agente Asignado: ${agentEmailError.message}`);
        }

        try {
          const company = await this.userService.findCompanyById(
            user.companyId,
          );
          emailData['fullname'] = agent.name + ' ' + agent.lastname;
          if (company?.email) {
            await this.emailService.sendEmail(
              company.email,
              `Cierre tikect ${emailData.prefix}-${resultData.ticketNumber}`,
              'email-template-assigned-modify.html',
              emailData,
            );
          }
        } catch (agentEmailError) {
          console.error('Error al enviar correo al agente o empresa:', agentEmailError);
          emailErrors.push(`Empresa: ${agentEmailError.message}`);
        }
        
      } catch (emailError) {
        console.log(emailError);
        if (emailErrors.length > 0) {
           emailStatus = `El ticket se creó correctamente, pero ocurrieron errores al enviar correos: ${emailErrors.join(
            ' | ',
          )}`;
        }
        // emailStatus =
        //   'El ticket fue pasado a CERRADO exitosamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico de Branzon.';
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);

      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error('Error in updateStatusToCloseted:', error);
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del ticket.',
      );
    }
  }


  async updateStatusToRejected(
    userSession: userSession,
    id: string,
    description: string
  ): Promise<{ data: Ticket[]; message: string }> {
    const queryRunner = this.ticketRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const updatedTickets: Ticket[] = [];
    const manager = queryRunner.manager;
    const emailErrors: { ticketId: string; email: string; error: any }[] = [];

    try {
      const rejectedState = await this.ticketStateService.findRejectedPreapprovalTicketState(manager);
      if (!rejectedState) {
        throw new NotFoundException('Estado "Rechazado" no configurado en el sistema');
      }

      // for (const id of ids) {
        const note = manager.create(NoteAgentTicket, {
          description,
          userId: userSession.id,
          ticketId: id,
        });
        await manager.save(note);

        const ticket = await manager.preload(Ticket, {
          id,
          ticketStateId: rejectedState.id,
        });

        if (!ticket) {
          throw new NotFoundException(`No se encontró el ticket con ID '${id}'`);
        }

        const updatedTicket = await manager.save(ticket);
        
        const existingAssignment = await manager.findOne(AssignedUserTicket, {
          where: {
            userId: userSession.id,
            ticketId: id,
          },
        });

        if (existingAssignment) {
          existingAssignment.state = false;
          await manager.save(existingAssignment);
        }
      // }

      await queryRunner.commitTransaction();

      // Enviar correos y limpiar caché
      // for (const ticket of updatedTickets) {
        const resultData = await this.findOne(id);
        const user = await this.userService.findById(resultData.userId);
        // if (!user) continue;

        const prefix = resultData.ticketTitle.ticketCategory.prefix;
        const priority = resultData.ticketTitle.ticketPriority.title;

        const emailData = {
          fullname: `${user.name} ${user.lastname}` || 'User',
          ticketState: resultData.ticketState.description,
          prefix,
          ticketId: resultData.id,
          userId: user.id,
          noteAgentTicket:description,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };

        try {
          await this.emailService.sendEmail(
            user.email,
            `Ticket Rechazado ${prefix}-${resultData.ticketNumber}`,
            'email-template-rejected.html',
            emailData,
            true,
          );
        } catch (emailError) {
          console.error('Error enviando email para ticket:', ticket.id, emailError);
          emailErrors.push({
            ticketId: ticket.id,
            email: user.email,
            error: emailError,
          });
        }

        await this.cacheManager.delCache(`ticket:${ticket.id}`);
      // }

      await this.cacheManager.delCache('tickets:*');
      await this.cacheManager.delCache('notes:*');

      // Construir mensaje
      let message = 'Ticket rechazado correctamente.';

      

      if (emailErrors.length > 0) {
        const errorDetails = emailErrors
          .map(
            (error) =>
              `\n- Ticket ID: ${error.ticketId}, Correo: ${error.email}, Motivo: ${error.error.message || 'Error desconocido'}`
          )
          .join('');
        message += '\n\n**Errores de envío:**' + errorDetails;
      }

      return {
        data: updatedTickets,
        message,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error en updateStatusToRejected:', error);
      throw new InternalServerErrorException(
        `Error al rechazar los tickets: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }


  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    try {
      const { assignedUsers, formResponse, ...ticketBaseData } =
        updateTicketDto;

      const ticket = await this.ticketRepository.preload({
        id,
        ...ticketBaseData,
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

  private async agentAssigned(
    branchId: string,
    lastStateId: string,
    manager: EntityManager,
  ): Promise<User | null> {
    let selectedAgent: User | null = null;
    const defaultAgents = await this.userService.findDefaultAgents(branchId, manager);
    console.log('Default Agents:', defaultAgents);
    for (const agent of defaultAgents) {
      if (!agent.limite_ticket || agent.limite_ticket === 0) {
        selectedAgent = agent;
        break;
      }

      const assignedCount = await manager
        .getRepository(AssignedUserTicket)
        .createQueryBuilder('assigned')
        .innerJoin('assigned.ticket', 'ticket')
        .innerJoin('ticket.ticketState', 'state')
        .where('assigned.userId = :userId', { userId: agent.id })
        .andWhere('assigned.state = true')
        .andWhere('state.id != :closeStateId', {
          closeStateId: lastStateId,
        })
        .getCount();
 console.log('assignedCount:', assignedCount);
 console.log('agent.limite_ticket:',  agent.limite_ticket);
      if (assignedCount < agent.limite_ticket) {
        selectedAgent = agent;
        break;
      }
    }
    return selectedAgent;
  }

  async getDashboardCards(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<{ data: any[] }> {
    try {
      endDate = this.formatedEndDate(endDate);
      const cacheKey = `dashboard-cards:user-${user.id}:startDate-${startDate}:endDate-${endDate}`;
      const cachedData = await this.cacheManager.getCache<{ data: any[] }>(
        cacheKey,
      );
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      if (cachedData) return cachedData;

      const [
        averageResponseTime,
        casesCreated,
        casesCompleted,
        customerSatisfaction,
      ] = await Promise.all([
        this.calculateAverageResponseTime(user, startDate, endDate),
        this.countCasesCreated(user, startDate, endDate),
        this.countCasesCompleted(user, startDate, endDate),
        this.calculateCustomerSatisfaction(user, startDate, endDate),
      ]);

      const result = [
        {
          iconColor: 'gray',
          data: averageResponseTime,
          title: 'Tiempo Promedio de Respuesta',
          icon: 'heroicons-outline:clock',
        },
        {
          iconColor: 'blue',
          data: casesCreated,
          title: 'Casos Creados',
          icon: 'material-outline:note_add',
        },
        {
          iconColor: 'success',
          data: casesCompleted,
          title: 'Casos Completados',
          icon: 'material-outline:speaker_notes',
        },
        {
          iconColor: 'yellow',
          title: 'Satisfacción del Cliente',
          data: customerSatisfaction,
          icon: 'heroicons-outline:users',
        },
      ];

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return { data: result };
    } catch (error) {
      console.error('Error in getDashboardCards:', error);
      throw new InternalServerErrorException(
        'Failed to fetch dashboard statistics.',
      );
    }
  }

  private async countCasesCreated(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    this.applyUserFilters(query, user);
    query.andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
      startDate,
      endDate,
    });

    return query.getCount();
  }

  private async countCasesCompleted(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const lastState = await this.ticketStateService.findLastTicketState();
    if (!lastState) return 0;

    const query = this.ticketRepository.createQueryBuilder('ticket');

    this.applyUserFilters(query, user);
    query
      .andWhere('ticket.ticketStateId = :stateId', { stateId: lastState.id })
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    return query.getCount();
  }

  private async calculateCustomerSatisfaction(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const lastState = await this.ticketStateService.findLastTicketState();
    if (!lastState) return '0/5';

    const query = this.surveyResponseRepository
      .createQueryBuilder('response')
      .select('AVG(calification.score)', 'avgScore')
      .innerJoin('response.ticket', 'ticket')
      .innerJoin('response.surveyCalification', 'calification');

    this.applyUserFilters(query, user);
    query
      .andWhere('ticket.ticketStateId = :stateId', { stateId: lastState.id })
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    const result = await query.getRawOne();
    const averageScore = result?.avgScore
      ? Math.round(parseFloat(result.avgScore) * 10) / 10
      : 0;

    return `${averageScore}/5`;
  }

  private async calculateAverageResponseTime(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const inProcessState = await this.ticketStateService.findInProcessState();
    const closedState = await this.ticketStateService.findLastTicketState();

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.branch', 'branch')
      .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
      .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
      .where('ticket."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket."deletedAt" IS NULL')
      .andWhere('ticket."state" = true')
      .andWhere('ticket."updatedAt" IS NOT NULL')
      .andWhere('ticket."ticketStateId" IN (:...validStates)', {
        validStates: [inProcessState.id, closedState.id],
      });

    this.applyUserFilters?.(query, user);

    const tickets = await query.getMany();

    let totalResponseHours = 0;
    let responseCount = 0;

    for (const ticket of tickets) {
      const branchId = ticket.branchId;
      const priority = ticket.ticketTitle?.ticketPriority;
      const responseSlahours = priority?.hoursResponse;

      if (!branchId || !responseSlahours) continue;

      const laborHours = await this.laborHoursService.findAll({ branchId });
      const holidays = await this.holidaysService.findAll({ branchId });

      const responseBusinessMinutes = calculateBusinessMinutesBetweenDates(
        ticket.createdAt,
        ticket.updatedAt,
        laborHours,
        holidays,
      );
      const responseBusinessHours = responseBusinessMinutes / 60;

      if (responseBusinessHours > 0) {
        totalResponseHours += responseBusinessHours;
        responseCount++;

        const withinSLA = responseBusinessHours <= responseSlahours;
        const stateLabel = ticket.ticketStateId === inProcessState.id ? 'en proceso' : 'cerrado';

        console.log(
          `⏱ Ticket ${ticket.id} (${stateLabel}) → ${responseBusinessHours.toFixed(2)} horas | SLA: ${responseSlahours}h | ${withinSLA ? '✅ Cumple SLA' : '❌ No cumple SLA'}`
        );
      }
    }

    const avgResponseHours = responseCount > 0
      ? (totalResponseHours / responseCount).toFixed(2)
      : '0.00';


    return `${avgResponseHours} horas`;
  }

  private applyUserFilters(
    query: SelectQueryBuilder<any>,
    user: userSession,
  ): void {
    const { isAdmin, isConfigurator, isAgent } = user.role;

    if (!isAdmin && !isConfigurator && !isAgent) {
      query.andWhere('ticket.userId = :userId', { userId: user.id });
    }

    if (isAgent) {
      query
        .leftJoin(
          'ticket.assignedUsers',
          'assignedUsers'
        )
        .andWhere('assignedUsers.userId = :agentId', {
          agentId: user.id,
        });
      if (!user.isDesignatedApprover) query.andWhere('assignedUsers.state = true');
    }
  }
  
  async getTicketsByCategoryStats(
    user: userSession,
    startDate: string,
    endDate: string,
  ) {
    try {
      endDate = this.formatedEndDate(endDate);
      const cacheKey = 'ticketsByCategoryStats';
      const cached = await this.cacheManager.getCache<{
        title: string;
        description: string;
        categories: string[];
        data: number[];
      }>(cacheKey);

      if (cached) return cached;

      // Obtener todos los tickets con sus categorías
      const ticketsWithCategoriesQuery =
        await this.ticketRepository.createQueryBuilder('ticket');

      this.applyUserFilters(ticketsWithCategoriesQuery, user);

      const ticketsWithCategories = await ticketsWithCategoriesQuery
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getMany();

      const total = ticketsWithCategories.length;

      // Si no hay tickets, devolver estructura vacía
      if (total === 0) {
        return {
          title: 'Tickets por Categoría',
          description: 'Total: 0 casos',
          categories: [],
          values: [],
        };
      }

      // Contar tickets por categoría
      const categoryMap = new Map<string, number>();

      ticketsWithCategories.forEach((ticket) => {
        const categoryName =
          ticket.ticketTitle?.ticketCategory?.description || 'Sin categoría';
        const currentCount = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, currentCount + 1);
      });

      // Ordenar categorías por cantidad (de mayor a menor)
      const sortedCategories = Array.from(categoryMap.entries()).sort(
        (a, b) => b[1] - a[1],
      );

      // Extraer arrays separados
      const categories = sortedCategories.map((item) => item[0]);
      const values = sortedCategories.map((item) => item[1]);

      const result = {
        data: {
          title: 'Tickets por Categoría',
          description: `Total: ${total} casos`,
          categories,
          values,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error en getTicketsByCategoryStats:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener las estadísticas de tickets por categoría.',
      );
    }
  }

  async getAverageResponse(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<{
    title: string;
    description: string;
    chartData: number[];
    chartLabels: string[];
  }> {
    endDate = this.formatedEndDate(endDate);

    const inProcessState = await this.ticketStateService.findInProcessState();
    const closedState = await this.ticketStateService.findLastTicketState();

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.branch', 'branch')
      .leftJoinAndSelect('ticket.ticketTitle', 'tt')
      .leftJoinAndSelect('tt.ticketCategory', 'tc')
      .where('ticket."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket."ticketStateId" IN (:...validStates)', {
          validStates: [inProcessState.id, closedState.id],
      })
      .andWhere('ticket."updatedAt" IS NOT NULL')
      .andWhere('ticket.state = true')
      .andWhere('ticket."deletedAt" IS NULL')
      .orderBy('ticket."createdAt"', "DESC");

    this.applyUserFilters?.(query, user);

    const tickets = await query.getMany();

    const chartLabels: string[] = [];
    const chartData: number[] = [];

    for (const ticket of tickets) {
      const branchId = ticket.branchId;
      const createdAt = ticket.createdAt;
      const updatedAt = ticket.updatedAt;
      const prefix = ticket.ticketTitle?.ticketCategory?.prefix || "";
      const ticketNumber = ticket.ticketNumber;

      if (!branchId || !createdAt || !updatedAt) continue;

      const laborHours = await this.laborHoursService.findAll({ branchId });
      const holidays = await this.holidaysService.findAll({ branchId });

      const businessMinutes = calculateBusinessMinutesBetweenDates(
        createdAt,
        updatedAt,
        laborHours,
        holidays
      );

      const hours =
        businessMinutes > 0 ? parseFloat((businessMinutes / 60).toFixed(2)) : 0;

      chartLabels.push(`${prefix}-${ticketNumber}`);
      chartData.push(hours);
    }


    return {
      title: "Tiempo Promedio de Respuesta por Ticket",
      description: "Horas hábiles entre la creación y finalización del ticket",
      chartData,
      chartLabels,
    };
  }

  async getSatisfactionByRange(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<{
    data: {
      title: string;
      description: string;
      chartData: number[];
      chartLabels: string[];
    };
  }> {
    try {
      const formatedstartDate = this.formatedstartDate(startDate);
      const formatedEndDate = this.formatedEndDate(endDate);

      const cacheKey = `satisfaction-range:${user.id}:${formatedstartDate}:${formatedEndDate}`;
      const cached = await this.cacheManager.getCache<{
        data: {
          title: string;
          description: string;
          chartData: number[];
          chartLabels: string[];
        };
      }>(cacheKey);
      // if (cached) return cached;

      const rawData = await this.surveyResponseRepository
        .createQueryBuilder('response')
        .select([
          "TO_CHAR(DATE_TRUNC('month', response.createdAt), 'YYYY-MM') as month",
          'AVG(calification.score) as average_score',
        ])
        .innerJoin('response.surveyCalification', 'calification')
        .innerJoin('response.ticket', 'ticket')
        .where('response.createdAt BETWEEN :startDate AND :endDate', {
          startDate: formatedstartDate,
          endDate: formatedEndDate,
        })
        .groupBy("DATE_TRUNC('month', response.createdAt)")
        .orderBy('month', 'ASC')
        .getRawMany();

      // Generar todos los meses en el rango
      const chartData: number[] = [];
      const chartLabels: string[] = [];

      const start = new Date(formatedstartDate);
      const end = new Date(formatedEndDate);
      end.setDate(1); // Asegura que sea el primer día del mes
      end.setMonth(end.getMonth() + 1); // Incluir mes final
      
      const dataMap = new Map(
        rawData.map((row) => [row.month, Number(row.average_score)]),
      );

      const current = new Date(start);
      current.setDate(1);

      while (current < end) {
        const key = current.toISOString().slice(0, 7); // 'YYYY-MM'
        chartLabels.push(key);
        chartData.push(dataMap.get(key) ?? 0);
        current.setMonth(current.getMonth() + 1);
      }

      const result = {
        data: {
          title: 'Indicador de Satisfacción',
          description: `Evaluación desde ${startDate} hasta ${endDate}`,
          chartData,
          chartLabels,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error en getSatisfactionByRange:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el indicador de satisfacción.',
      );
    }
  }

  // private processSatisfactionByRange(
  //   rawData: any[],
  //   startDate: string,
  //   endDate: string,
  // ): {
  //   chartData: number[];
  //   chartLabels: string[];
  // } {
  //   const monthNames = [
  //     'Ene',
  //     'Feb',
  //     'Mar',
  //     'Abr',
  //     'May',
  //     'Jun',
  //     'Jul',
  //     'Ago',
  //     'Sep',
  //     'Oct',
  //     'Nov',
  //     'Dic',
  //   ];
  //   const chartLabels: string[] = [];
  //   const chartData: number[] = [];
  //   const startDateFormated = new Date(startDate);
  //   const endDateFormated = new Date(endDate);

  //   // Normaliza fechas al primer día del mes
  //   let current = new Date(
  //     startDateFormated.getFullYear(),
  //     startDateFormated.getMonth(),
  //     1,
  //   );
  //   const end = new Date(
  //     endDateFormated.getFullYear(),
  //     endDateFormated.getMonth(),
  //     1,
  //   );

  //   while (current <= end) {
  //     const month = current.getMonth();
  //     const year = current.getFullYear();
  //     const label = `${monthNames[month]} ${year}`;
  //     chartLabels.push(label);

  //     // Buscar si hay un dato en rawData para ese mes
  //     const row = rawData.find((r) => {
  //       const d = new Date(r.month);
  //       return d.getMonth() === month && d.getFullYear() === year;
  //     });

  //     chartData.push(row ? parseInt(row.average_score) : 0);

  //     current.setMonth(current.getMonth() + 1);
  //   }

  //   return { chartData, chartLabels };
  // }

  async getCaseStatusByMonth(
    user: userSession,
    startDate: string,
    endDate: string,
  ): Promise<DashboardChartGroupBar> {
    startDate = this.formatedstartDate(startDate);
    endDate = this.formatedEndDate(endDate);

    const stateMap = (await this.ticketStateService.findAll()).data;

    const stateIds: Record<string, string> = {};
    const stateNames: string[] = [];

    for (const s of stateMap) {
      stateIds[s.title] = s.id;
      stateNames.push(s.title);
    }

    // Meses del rango
    const monthIndexMap = this.getMonthNamesBetween(startDate, endDate);
    // Consulta agrupada por mes, año y estado
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select([
        `EXTRACT(MONTH FROM ticket.createdAt) as month_num`,
        `EXTRACT(YEAR FROM ticket.createdAt) as year_num`,
        `ticket.ticketStateId as stateId`,
        `COUNT(*) as count`,
      ]);

    this.applyUserFilters(query, user);

    query
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket.ticketStateId IN (:...stateIds)', {
        stateIds: Object.values(stateIds),
      })
      .groupBy('month_num, year_num, ticket.ticketStateId')
      .orderBy('year_num', 'ASC')
      .addOrderBy('month_num', 'ASC');

    const raw = await query.getRawMany();

    // Inicializa los arrays de datos por estado
    const dataByState: Record<string, number[]> = {};
    for (const name of stateNames) {
      dataByState[name] = Array(monthIndexMap.length).fill(0);
    }

    // Llena los datos en su índice correspondiente
    for (const row of raw) {
      const stateName = Object.keys(stateIds).find(
        (key) => stateIds[key] === row.stateid,
      );
      if (!stateName) continue;

      const monthNum = parseInt(row.month_num, 10);
      const yearNum = parseInt(row.year_num, 10);

      const monthIndex = monthIndexMap.findIndex(
        (m) => m.month === monthNum && m.year === yearNum,
      );

      if (monthIndex !== -1) {
        dataByState[stateName][monthIndex] = parseInt(row.count, 10);
      }
    }

    const totalCases = raw.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    return {
      title: 'Estado de Casos',
      description: `Total de casos: ${totalCases}`,
      categories: monthIndexMap.map((m) => m.label), // Ej: ['Abr 2025', 'May 2025', ...]
      series: stateNames.map((name) => ({
        name,
        data: dataByState[name],
      })),
    };
  }

  async getAgentPerformance(
    user: userSession,
    options: {
      agentCount?: number;
      startDate?: string;
      endDate?: string;
      branchIds?: string[];
      agentSearch?: string;
      isAgentDefault?: boolean | null; // This type is correctly defined as boolean or null
    } = {},
  ): Promise<{
    data: DashboardChartGroupBar;
  }> {
    try {
      const { agentCount = 4, startDate, endDate, branchIds, agentSearch, isAgentDefault } = options;

      const startDateFormated = this.formatedstartDate(startDate);
      const endDateFormated = this.formatedEndDate(endDate);

      // --- START: Updated cacheKey to include new filters ---
      const cacheKey = `agent-performance:${
        user.id
      }:${agentCount}:${startDateFormated}:${endDateFormated}:${
        branchIds?.join(',') || 'all'
      }:${agentSearch || ''}:${isAgentDefault !== undefined && isAgentDefault !== null ? isAgentDefault : 'all'}`;
      // --- END: Updated cacheKey ---

      const cached = await this.cacheManager.getCache<{
        data: DashboardChartGroupBar;
      }>(cacheKey);
      if (cached) return cached;

      // 1. Obtener el ID del estado con mayor orden (el final)
      const lastState = await this.ticketStateService.findLastTicketState();

      if (!lastState) {
        throw new Error('No se pudo determinar el último estado de ticket');
      }

      const categories = this.generateMonthLabels(
        startDateFormated,
        endDateFormated,
      );

      // 2. Obtener todos los tickets del rango y su información
      const query = this.ticketRepository
        .createQueryBuilder('ticket')
        .innerJoin('ticket.assignedUsers', 'assignment')
        .innerJoin('assignment.user', 'user')
        .innerJoin('user.role', 'role')
        .innerJoin('ticket.ticketState', 'state')
        .where('role.isAgent = true')
        .andWhere('assignment.state = true')
        .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
          startDate: startDateFormated,
          endDate: endDateFormated,
        })
        .andWhere('state.id = :lastStateId', { lastStateId: lastState.id });

      // Apply branchIds filter if provided
      if (branchIds?.length) {
        query.andWhere('ticket.branchId IN (:...branchIds)', { branchIds });
      }
  
      // --- START: Apply agentSearch (ILIKE) filter ---
      if (agentSearch) {
        query.andWhere(
          `(CONCAT(user.name, '',  user.lastname) ILIKE :agentSearch)`,
          { agentSearch: `%${agentSearch}%` },
        );
      }
      // --- END: Apply agentSearch filter ---

      // --- START: Apply isDefaultAgent filter ---
      if (isAgentDefault !== undefined) {
        query.andWhere('user.isAgentDefault = :isAgentDefault', { isAgentDefault });
      }
      // --- END: Apply isDefaultAgent filter ---


      const rawData = await query
        .select([
          'user.id as user_id',
          'user.name as user_name',
          'user.lastname as user_lastname',
          'EXTRACT(MONTH FROM ticket.createdAt) as month_num',
          'EXTRACT(YEAR FROM ticket.createdAt) as year_num',
          'COUNT(ticket.id) as count',
        ])
        .groupBy('user.id, user.name, user.lastname, month_num, year_num')
        .orderBy('year_num', 'ASC')
        .addOrderBy('month_num', 'ASC')
        .getRawMany();

      // 3. Agrupar por agente
      const agentMap: Record<string, { name: string; data: number[] }> = {};
      const agentIdsSeen: Set<string> = new Set();

      for (const row of rawData) {
        const agentId = row.user_id;
        const agentName = `${row.user_name} ${row.user_lastname}`; // Access directly from row.user if selected in query
        const label = this.formatMonthLabel(
          parseInt(row.month_num),
          parseInt(row.year_num),
        );
        const index = categories.indexOf(label);

        if (!agentMap[agentId]) {
          agentMap[agentId] = {
            name: agentName,
            data: Array(categories.length).fill(0),
          };
        }

        if (index !== -1) {
          agentMap[agentId].data[index] = parseInt(row.count);
        }

        agentIdsSeen.add(agentId);
      }

      // 4. Asegurar que estén los top N agentes por nombre
      const topAgentIds = Array.from(agentIdsSeen).slice(0, agentCount);
      const series = topAgentIds.map((agentId) => agentMap[agentId]);

      const totalTickets = series.reduce(
        (sum, agent) => sum + agent.data.reduce((a, b) => a + b, 0),
        0,
      );

      const result = {
        data: {
          title: 'Rendimiento por Agente',
          description: `Total de tickets completados: ${totalTickets}`,
          categories,
          series,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error en getAgentPerformance:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el rendimiento por agente.',
      );
    }
  }

  private formatMonthLabel(month: number, year: number): string {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  private generateMonthLabels(startDate: string, endDate: string): string[] {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const labels: string[] = [];

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    let current = new Date(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      1,
    );
    const end = new Date(
      parsedEndDate.getFullYear(),
      parsedEndDate.getMonth(),
      1,
    );

    while (current <= end) {
      const label = `${
        monthNames[current.getMonth()]
      } ${current.getFullYear()}`;
      labels.push(label);
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  }

  private formatedEndDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}T23:59:59`;
  }

  private formatedstartDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private getMonthNamesBetween(
    startDate: string,
    endDate: string,
  ): { label: string; month: number; year: number }[] {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const result: { label: string; month: number; year: number }[] = [];
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    const start = new Date(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      1,
    );
    const end = new Date(
      parsedEndDate.getFullYear(),
      parsedEndDate.getMonth(),
      1,
    );

    let current = new Date(start);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      console.error('Fechas inválidas:', { startDate, endDate });
      // return result;
    }
    while (current <= end) {
      result.push({
        label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
        month: current.getMonth() + 1,
        year: current.getFullYear(),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }
}
