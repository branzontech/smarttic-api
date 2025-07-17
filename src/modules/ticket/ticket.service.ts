import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { CacheManagerService } from "src/common/cache-manager/cache-manager.service";
import { Ticket } from "./entities/ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { CACHE_TTL } from "src/common/constants";
import { TicketStateService } from "../ticket-state/ticket-state.service";
import { EmailService } from "src/common/email/email.service";
import {
  userSession,
  DashboardChartGroupBar,
  columnDataFilter,
  columnDataOrder,
} from "src/common/types";
import { UsersService } from "../users/users.service";
import { AssignedUserTicket } from "../assigned-user-ticket/entities/assigned-user-ticket.entity";
import { SurveyResponse } from "../survey-response/entities/survey-response.entity";
import { TicketDetail } from "../ticket-detail/entities/ticket-detail.entity";
import { FormResponse } from "../form-responses/entities/form-response.entity";
import { FormResponseFile } from "../form-response-files/entities/form-response-file.entity";

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketDetail)
    private readonly ticketDetailRepository: Repository<TicketDetail>,
    private readonly cacheManager: CacheManagerService,
    private readonly ticketStateService: TicketStateService,
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(FormResponse)
    private readonly formResponseRepository: Repository<FormResponse>,
    @InjectRepository(FormResponseFile)
    private readonly formResponseFilesRepository: Repository<FormResponseFile>,
    private readonly userService: UsersService,
    private readonly emailService: EmailService
  ) {}

  async create(
    createTicketDto: Partial<CreateTicketDto>,
    user: userSession,
    files: Express.Multer.File[]
  ): Promise<{ data: Ticket; message: string }> {
    const queryRunner =
      this.ticketRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!user?.id) throw new BadRequestException("Usuario no autenticado");

      const [ticketState, agentDefault] = await Promise.all([
        this.ticketStateService.findByOrder(1),
        this.userService.findDefaultAgent(user.branchId),
      ]);

      const lastState = await this.ticketStateService.findLastTicketState();


      if (agentDefault?.limite_ticket) {
        const ticketsAsignados = await this.assignedUserTicketRepository

          .createQueryBuilder("assigned")
          .innerJoin("assigned.ticket", "ticket")
          .innerJoin("ticket.ticketState", "state")
          .where("assigned.userId = :userId", { userId: agentDefault.id })
          .andWhere("assigned.state = true")
          .andWhere("state.id != :cerradoStateId", {
            cerradoStateId: lastState.id,
          })
          .getCount();

        if (ticketsAsignados >= agentDefault.limite_ticket) {
          throw new BadRequestException(
            `El agente ${agentDefault.name} ha alcanzado su límite de tickets activos (${agentDefault.limite_ticket}).`
          );
        }
      }

      if (!ticketState)
        throw new NotFoundException(
          "No se encontró el estado inicial del ticket"
        );
      if (!createTicketDto.ticketTitleId)
        throw new BadRequestException("El título del ticket es obligatorio");

      const branchId =
        user.role.isAdmin || user.role.isConfigurator
          ? createTicketDto.branchId
          : user.branchId;
      if (!branchId)
        throw new BadRequestException("El ticket no tiene sucursal asignada");

      const {
        formResponse: formResponseData,
        assignedUsers,
        ...ticketBaseData
      } = createTicketDto;

      const ticketData = {
        ...ticketBaseData,
        userId: user.id,
        branchId: branchId,
        ticketStateId: ticketState.id,
      };

      const newTicket = this.ticketRepository.create(ticketData);
      const savedTicket = await queryRunner.manager.save(newTicket);

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
        await queryRunner.manager.save(formResponse);

        if (files?.length > 0) {
          for (const file of files) {
            const fileEntity = this.formResponseFilesRepository.create({
              formResponseId: formResponse.id,
              fieldKey: file.fieldname,
              filename: file.filename,
              originalName: file.originalname,
            });

            await queryRunner.manager.save(fileEntity);
          }
        }

        savedTicket.formResponse = formResponse;
        await queryRunner.manager.save(Ticket, savedTicket);
      }

      const assignedUserId = user.role.isAgent ? user.id : agentDefault?.id;
      if (assignedUserId) {
        const assigned = this.assignedUserTicketRepository.create({
          userId: assignedUserId,
          ticketId: savedTicket.id,
        });
        await queryRunner.manager.save(assigned);
      }

      await queryRunner.commitTransaction();

      const resultData = await this.findOne(savedTicket.id);

      let emailStatus = "Ticket creado exitosamente";
      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || "User",
          ticketState: ticketState.description,
          prefix: resultData.ticketTitle.ticketCategory.prefix,
          ticketId: resultData.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: resultData.ticketTitle.ticketPriority.title,
          estimatedTime: `${resultData.ticketTitle.ticketPriority.hoursResponse} horas`,
          ticketCreatedAt: resultData.createdAt,
        };

        await this.emailService.sendEmail(
          user.email,
          `${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
          "email-template-open.html",
          emailData
        );
        if (agentDefault.email) {
          const company = await this.userService.findById(user.companyId);
          emailData["fullname"] =
            agentDefault.name + " " + agentDefault.lastname;
          await this.emailService.sendEmail(
            `${agentDefault.email},${company.email}`,
            `Asignacion ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
            "email-template-assigned.html",
            emailData
          );
        }

        if (!agentDefault.email && user.companyId) {
          const company = await this.userService.findById(user.companyId);
          if (company.email) {
            await this.emailService.sendEmail(
              company.email,
              `Asignacion ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
              "email-template-assigned.html",
              emailData
            );
          }
        }
      } catch (emailError) {
        emailStatus =
          "El ticket se creó correctamente, pero no se pudo enviar la notificación por correo electrónico. Contacte con el soporte técnico.";
      }

      await this.cacheManager.delCache(`tickets:*`);

      return {
        data: resultData,
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
        `Se produjo un error al crear el ticket: ${
          error?.message || "Unexpected error"
        }`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    user: userSession,
    skip: number = 0,
    take: number = 10,
    filter?: string,
    columnFilters?: columnDataFilter[],
    orderBy?: columnDataOrder[]
  ) {
    try {
      const { isAdmin, isAgent, isConfigurator } = user.role;
      const isClient = !isAdmin && !isAgent && !isConfigurator;
      const filtersKey =
        columnFilters?.map((f) => `${f.id}:${f.value}`).join(",") || "";
      const orderKey = orderBy?.map((f) => `${f.id}:${f.desc}`).join(",") || "";
      const cacheKey = `tickets:userId:${
        user.id
      }:skip:${skip}:take:${take}:filter:${
        filter || ""
      }:columnFilters:${filtersKey}:columnOrder:${orderKey}`;
      const cachedData = await this.cacheManager.getCache<{
        data: Ticket[];
        total: number;
      }>(cacheKey);

      if (cachedData) return cachedData;

      const queryBuilder = this.ticketRepository
        .createQueryBuilder("ticket")
        .leftJoinAndSelect("ticket.formResponse", "formResponse")
        .leftJoinAndSelect("formResponse.form", "form")
        .leftJoinAndSelect("ticket.ticketState", "ticketState")
        .leftJoinAndSelect("ticket.ticketTitle", "ticketTitle")
        .leftJoinAndSelect("ticket.user", "user")
        .leftJoinAndSelect("ticket.branch", "branch")
        .leftJoinAndSelect("user.company", "company")
        .leftJoinAndSelect("ticketTitle.ticketCategory", "ticketCategory")
        .leftJoinAndSelect("ticketTitle.ticketPriority", "ticketPriority")
        .leftJoinAndSelect(
          "ticket.assignedUsers",
          "assignedUsers",
          "assignedUsers.state = true"
        )
        .leftJoinAndSelect("assignedUsers.user", "agent");

      // Filtro por rol
      if (!isConfigurator) {
        if (isClient) {
          queryBuilder.andWhere("ticket.userId = :userId", { userId: user.id });
        }
        if (isAgent) {
          queryBuilder.andWhere("assignedUsers.userId = :agentId", {
            agentId: user.id,
          });
        }
        if (isAdmin) {
          queryBuilder.andWhere("user.companyId = :userId", {
            userId: user.id,
          });
        }
      }

      // Filtro por texto de búsqueda
      if (filter) {
        const conditions: string[] = [];

        // Campos visibles por todos
        conditions.push(
          `CONCAT(ticketCategory.prefix,'-', "ticket"."ticketNumber") ILIKE :filter`,
          "ticketTitle.description ILIKE :filter",
          "ticketPriority.title ILIKE :filter",
          "ticketState.title ILIKE :filter",
          "ticketState.title ILIKE :filter",
          "agent.name ILIKE :filter",
          "agent.lastname ILIKE :filter"
        );

        if (!isClient) {
          conditions.push(
            "user.name ILIKE :filter",
            "user.lastname ILIKE :filter"
          );
        }

        if (isConfigurator) {
          conditions.push("company.companyname ILIKE :filter");
        }

        if (isConfigurator || isAdmin) {
          conditions.push("branch.name ILIKE :filter");
        }

        queryBuilder.andWhere(`(${conditions.join(" OR ")})`, {
          filter: `%${filter}%`,
        });
      }

      if (columnFilters?.length) {
        for (const { id, value } of columnFilters) {
          if (!value) continue;

          if (id === "user") {
            queryBuilder.andWhere(
              `(user.name ILIKE :userValue OR user.lastname ILIKE :userValue OR user.companyname ILIKE :userValue)`,
              { userValue: `%${value}%` }
            );
            continue;
          }
          if (id === "agent") {
            queryBuilder.andWhere(
              `(agent.name ILIKE :agentValue OR agent.lastname ILIKE :agentValue)`,
              { agentValue: `%${value}%` }
            );
            continue;
          }

          if (id === "ticketNomenclature") {
            queryBuilder.andWhere(
              `(CONCAT(ticketCategory.prefix,'-', "ticket"."ticketNumber") ILIKE :ticketNomenclatureValue)`,
              { ticketNomenclatureValue: `%${value}%` }
            );
            continue;
          }

          // Convertir a alias y campo
          const [alias, field] = id.split(".");
          if (!alias || !field) continue;

          const paramName = `${alias}_${field}`;

          // Agrega el filtro ILIKE de forma dinámica
          queryBuilder.andWhere(`${alias}.${field} ILIKE :${paramName}`, {
            [paramName]: `%${value}%`,
          });
        }
      }

      if (orderBy?.length) {
        for (const { id, desc } of orderBy) {
          if (!id) continue;

          const parts = id.split(".");
          if (parts.length !== 2) continue; // Asegura que sea del tipo alias.campo

          const [alias, field] = parts;
          queryBuilder.addOrderBy(`${alias}.${field}`, desc ? "DESC" : "ASC");
        }
      } else {
        queryBuilder.orderBy("ticket.createdAt", "DESC");
      }

      queryBuilder.skip(skip).take(take);

      const [tickets, total] = await queryBuilder.getManyAndCount();

      const result = { data: tickets, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Error in findAll:", error);
      throw new InternalServerErrorException(
        "Failed to fetch the list of tickets."
      );
    }
  }

  async findOne(id: string): Promise<Ticket> {
    try {
      const cacheKey = `ticket:${id}`;
      let ticket = await this.cacheManager.getCache<Ticket>(cacheKey);

      if (!ticket) {
        const queryBuilder = this.ticketRepository
          .createQueryBuilder("ticket")
          .leftJoinAndSelect("ticket.formResponse", "formResponse")
          .leftJoinAndSelect("formResponse.form", "form")
          .leftJoinAndSelect("ticket.ticketState", "ticketState")
          .leftJoinAndSelect("ticket.ticketTitle", "ticketTitle")
          .leftJoinAndSelect("ticket.user", "user")
          .leftJoinAndSelect("ticketTitle.ticketCategory", "ticketCategory")
          .leftJoinAndSelect("ticketTitle.ticketPriority", "ticketPriority")
          .leftJoinAndSelect(
            "ticket.assignedUsers",
            "assignedUsers",
            "assignedUsers.state = true"
          )
          .leftJoinAndSelect("assignedUsers.user", "agent")
          .where("ticket.id = :id", { id });

        ticket = await queryBuilder.getOne();

        if (!ticket) {
          throw new NotFoundException(`Ticket con ID '${id}' no encontrado.`);
        }

        await this.cacheManager.setCache(cacheKey, ticket);
      }

      return ticket;
    } catch (error) {
      console.error("Error en findOne:", error);
      throw new InternalServerErrorException("No se pudo obtener el ticket.");
    }
  }

  async updateStatusToInProcess(
    id: string
  ): Promise<{ data: Ticket; message: string }> {
    try {
      // Find the state with order 3
      const ticketState = await this.ticketStateService.findByOrder(2);
      if (!ticketState) {
        throw new NotFoundException(`State with order '2' not found.`);
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
      let emailStatus = "Ticket pass to In Process successfully";
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;

      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || "User",
          ticketState: ticketState.title,
          prefix: prefix,
          ticketNumber: resultData.ticketNumber,
          ticketId: resultData.id,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };

        await this.emailService.sendEmail(
          user.email,
          `Devuelta ${prefix}-${updatedTicket.ticketNumber}`,
          "email-template.html",
          emailData
        );
        if (ticket.user) {
          const agent = await this.userService.findById(
            ticket.assignedUsers[0].userId
          );
          const company = await this.userService.findById(user.companyId);
          emailData["fullname"] = agent.name + " " + agent.lastname;
          await this.emailService.sendEmail(
            `${agent.email},${company.email}`,
            `Modificacion tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
            "email-template-assigned-modify.html",
            emailData
          );
        }
      } catch (emailError) {
        console.log(emailError);
        emailStatus =
          "Ticket was pass to In Process successfully, but the email notification could not be sent. Please contact Branzon Tech support";
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error("Error in updateStatusToAssisted:", error);
      throw new InternalServerErrorException(
        "Failed to update the ticket status."
      );
    }
  }

  async updateStatusToAssisted(
    id: string
  ): Promise<{ data: Ticket; message: string }> {
    try {
      // Find the state with order 3
      console.log("entro");
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
      let emailStatus = "Ticket pass to Assisted successfully";
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;

      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || "User",
          ticketState: ticketState.title,
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
          "email-template.html",
          emailData
        );
        if (ticket.user) {
          const agent = await this.userService.findById(
            ticket.assignedUsers[0].userId
          );
          const company = await this.userService.findById(user.companyId);
          emailData["fullname"] = agent.name + " " + agent.lastname;
          await this.emailService.sendEmail(
            `${agent.email},${company.email}`,
            `Modificacion tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
            "email-template-assigned-modify.html",
            emailData
          );
        }
      } catch (emailError) {
        console.log(emailError);
        emailStatus =
          "Ticket was pass to Assisted successfully, but the email notification could not be sent. Please contact Branzon Tech support";
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);
      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error("Error in updateStatusToAssisted:", error);
      throw new InternalServerErrorException(
        "Failed to update the ticket status."
      );
    }
  }

  async updateStatusToCloseted(
    id: string
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
        throw new NotFoundException(`Ticket with ID '${id}' not found.`);
      }

      const updatedTicket = await this.ticketRepository.save(ticket);
      const user = await this.userService.findById(updatedTicket.userId);
      if (!user) {
        throw new NotFoundException(`Error finding ticket user.`);
      }
      const resultData = await this.findOne(updatedTicket.id);

      let emailStatus = "Ticket Closeted successfully";
      const prefix = resultData.ticketTitle.ticketCategory.prefix;
      const priority = resultData.ticketTitle.ticketPriority.title;

      try {
        const emailData = {
          fullname: `${user.name} ${user.lastname}` || "User",
          ticketState: resultData.ticketState.description,
          prefix: prefix,
          ticketId: resultData.id,
          userId: user.id,
          ticketNumber: resultData.ticketNumber,
          ticketTitle: resultData.ticketTitle.description,
          ticketPriority: priority,
          ticketCreatedAt: resultData.createdAt,
        };

        await this.emailService.sendEmail(
          user.email,
          `Actualizacion ${prefix}-${updatedTicket.ticketNumber}`,
          "email-template-closet.html",
          emailData,
          true
        );
        if (ticket.user) {
          const agent = await this.userService.findById(
            ticket.assignedUsers[0].userId
          );
          const company = await this.userService.findById(user.companyId);
          emailData["fullname"] = agent.name + " " + agent.lastname;
          await this.emailService.sendEmail(
            `${agent.email},${company.email}`,
            `Cierre tikect ${resultData.ticketTitle.ticketCategory.prefix}-${resultData.ticketNumber}`,
            "email-template-assigned-closet.html",
            emailData
          );
        }
      } catch (emailError) {
        console.log(emailError);
        emailStatus =
          "Ticket was pass to Closeted successfully, but the email notification could not be sent. Please contact Branzon Tech support";
      }
      await this.cacheManager.delCache(`ticket:${id}`);
      await this.cacheManager.delCache(`tickets:*`);

      return {
        data: updatedTicket,
        message: emailStatus,
      };
    } catch (error) {
      console.error("Error in updateStatusToCloseted:", error);
      throw new InternalServerErrorException(
        "Failed to update the ticket status."
      );
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
      console.error("Error en update:", error);
      throw new InternalServerErrorException(
        "No se pudo actualizar el ticket."
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
      console.error("Error en remove:", error);
      throw new InternalServerErrorException("No se pudo eliminar el ticket.");
    }
  }

  async getDashboardCards(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<{ data: any[] }> {
    try {
      endDate = this.formatedEndDate(endDate);
      const cacheKey = `dashboard-cards:user-${user.id}:startDate-${startDate}:endDate-${endDate}`;
      const cachedData = await this.cacheManager.getCache<{ data: any[] }>(
        cacheKey
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
          iconColor: "gray",
          data: averageResponseTime,
          title: "Tiempo Promedio de Respuesta",
          icon: "heroicons-outline:clock",
        },
        {
          iconColor: "blue",
          data: casesCreated,
          title: "Casos Creados",
          icon: "material-outline:note_add",
        },
        {
          iconColor: "success",
          data: casesCompleted,
          title: "Casos Completados",
          icon: "material-outline:speaker_notes",
        },
        {
          iconColor: "yellow",
          title: "Satisfacción del Cliente",
          data: customerSatisfaction,
          icon: "heroicons-outline:users",
        },
      ];

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return { data: result };
    } catch (error) {
      console.error("Error in getDashboardCards:", error);
      throw new InternalServerErrorException(
        "Failed to fetch dashboard statistics."
      );
    }
  }

  private async countCasesCreated(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const query = this.ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    this.applyUserFilters(query, user);

    return query.getCount();
  }

  private async countCasesCompleted(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const lastState = await this.ticketStateService.findLastTicketState();
    if (!lastState) return 0;

    const query = this.ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.ticketStateId = :stateId", { stateId: lastState.id })
      .andWhere("ticket.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    this.applyUserFilters(query, user);

    return query.getCount();
  }

  private async calculateCustomerSatisfaction(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<string> {
    const lastState = await this.ticketStateService.findLastTicketState();
    if (!lastState) return "0/5";

    const query = this.surveyResponseRepository
      .createQueryBuilder("response")
      .select("AVG(calification.score)", "avgScore")
      .innerJoin("response.ticket", "ticket")
      .innerJoin("response.surveyCalification", "calification")
      .where("ticket.ticketStateId = :stateId", { stateId: lastState.id })
      .andWhere("ticket.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    this.applyUserFilters(query, user);

    const result = await query.getRawOne();
    const averageScore = result?.avgScore
      ? Math.round(parseFloat(result.avgScore) * 10) / 10
      : 0;

    return `${averageScore}/5`;
  }

  private async calculateAverageResponseTime(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<string> {
    const lastState = await this.ticketStateService.findLastTicketState();

    const query = this.ticketRepository
      .createQueryBuilder("ticket")
      .select(
        'ROUND(AVG(EXTRACT(EPOCH FROM (ticket."updatedAt" - ticket."createdAt")) / 3600)::numeric, 2)',
        "avgHours"
      )
      .where('ticket."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket."ticketStateId" = :stateId', { stateId: lastState.id })
      .andWhere("ticket.state = true")
      .andWhere('ticket."deletedAt" IS NULL')
      .andWhere('ticket."updatedAt" IS NOT NULL');

    this.applyUserFilters(query, user); // Si tienes filtros por usuario

    const result = await query.getRawOne();
    const avgHours = result?.avgHours ? parseFloat(result.avgHours) : 0;

    return `${avgHours} horas`;
  }

  private applyUserFilters(
    query: SelectQueryBuilder<any>,
    user: userSession
  ): void {
    const { isAdmin, isConfigurator, isAgent } = user.role;

    if (!isAdmin && !isConfigurator && !isAgent) {
      query.andWhere("ticket.userId = :userId", { userId: user.id });
    }

    if (isAgent) {
      query.innerJoin("ticket.assignedUsers", "au", "au.userId = :userId", {
        userId: user.id,
      });
    }
  }
  async getTicketsByCategoryStats(startDate: string, endDate: string) {
    try {
      endDate = this.formatedEndDate(endDate);
      const cacheKey = "ticketsByCategoryStats";
      const cached = await this.cacheManager.getCache<{
        title: string;
        description: string;
        categories: string[];
        data: number[];
      }>(cacheKey);

      if (cached) return cached;

      // Obtener todos los tickets con sus categorías
      const ticketsWithCategories = await this.ticketRepository
        .createQueryBuilder("ticket")
        .leftJoinAndSelect("ticket.ticketTitle", "ticketTitle")
        .leftJoinAndSelect("ticketTitle.ticketCategory", "ticketCategory")
        .where("ticket.createdAt BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .getMany();

      const total = ticketsWithCategories.length;

      // Si no hay tickets, devolver estructura vacía
      if (total === 0) {
        return {
          title: "Tickets por Categoría",
          description: "Total: 0 casos",
          categories: [],
          values: [],
        };
      }

      // Contar tickets por categoría
      const categoryMap = new Map<string, number>();

      ticketsWithCategories.forEach((ticket) => {
        const categoryName =
          ticket.ticketTitle?.ticketCategory?.description || "Sin categoría";
        const currentCount = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, currentCount + 1);
      });

      // Ordenar categorías por cantidad (de mayor a menor)
      const sortedCategories = Array.from(categoryMap.entries()).sort(
        (a, b) => b[1] - a[1]
      );

      // Extraer arrays separados
      const categories = sortedCategories.map((item) => item[0]);
      const values = sortedCategories.map((item) => item[1]);

      const result = {
        data: {
          title: "Tickets por Categoría",
          description: `Total: ${total} casos`,
          categories,
          values,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error("Error en getTicketsByCategoryStats:", error);
      throw new InternalServerErrorException(
        "No se pudo obtener las estadísticas de tickets por categoría."
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
    const query = this.ticketRepository
      .createQueryBuilder("t")
      .select('t."ticketNumber"', "ticketNumber")
      .addSelect('tc."prefix"', "prefix")
      .addSelect(
        `
        ROUND(EXTRACT(EPOCH FROM (
          (
            SELECT td."createdAt"
            FROM "TicketDetails" td
            INNER JOIN "Users" u ON td."userId" = u.id
            INNER JOIN "Roles" r ON u."roleId" = r.id
            WHERE td."ticketId" = t.id
            AND r."isAgent" = true
            ORDER BY td."createdAt" ASC
            LIMIT 1
          ) - t."createdAt"
        )) / 60, 2)
      `,
        "agent_response_time_minutes"
      )
      .leftJoin("t.ticketTitle", "tt")
      .leftJoin("tt.ticketCategory", "tc")
      .where('t."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere(
        `
        (
          SELECT td."createdAt"
          FROM "TicketDetails" td
          INNER JOIN "Users" u ON td."userId" = u.id
          INNER JOIN "Roles" r ON u."roleId" = r.id
          WHERE td."ticketId" = t.id
          AND r."isAgent" = true
          ORDER BY td."createdAt" ASC
          LIMIT 1
        ) IS NOT NULL
      `
      )
      .orderBy('t."createdAt"', "DESC");

    this.applyUserFilters(query, user);
    const raw = await query.getRawMany();

    const chartLabels = raw.map((r) => `${r.prefix}-${r.ticketNumber}`);
    const chartData = raw.map((r) => parseFloat(r.agent_response_time_minutes));

    return {
      title: "Tiempo Promedio de Respuesta por Ticket",
      description: "Minutos hasta la primera respuesta del agente",
      chartData,
      chartLabels,
    };
  }

  async getSatisfactionByRange(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<{
    data: {
      title: string;
      description: string;
      chartData: number[];
      chartLabels: string[];
    };
  }> {
    try {
      endDate = this.formatedEndDate(endDate);

      const cacheKey = `satisfaction-range:${user.id}:${startDate}:${endDate}`;
      const cached = await this.cacheManager.getCache<{
        data: {
          title: string;
          description: string;
          chartData: number[];
          chartLabels: string[];
        };
      }>(cacheKey);
      if (cached) return cached;

      const rawData = await this.surveyResponseRepository
        .createQueryBuilder("response")
        .select([
          "DATE_TRUNC('month', response.createdAt) as month",
          "ROUND(AVG(calification.score), 0) as average_score",
        ])
        .innerJoin("response.surveyCalification", "calification")
        .innerJoin("response.ticket", "ticket")
        .where("response.createdAt BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy("DATE_TRUNC('month', response.createdAt)")
        .orderBy("month", "ASC")
        .getRawMany();

      const { chartData, chartLabels } = this.processSatisfactionByRange(
        rawData,
        startDate,
        endDate
      );

      const result = {
        data: {
          title: "Indicador de Satisfacción",
          description: `Evaluación desde ${startDate} hasta ${endDate}`,
          chartData,
          chartLabels,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error("Error en getSatisfactionByRange:", error);
      throw new InternalServerErrorException(
        "No se pudo obtener el indicador de satisfacción."
      );
    }
  }

  private processSatisfactionByRange(
    rawData: any[],
    startDate: string,
    endDate: string
  ): {
    chartData: number[];
    chartLabels: string[];
  } {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const chartLabels: string[] = [];
    const chartData: number[] = [];
    const startDateFormated = new Date(startDate);
    const endDateFormated = new Date(endDate);

    // Normaliza fechas al primer día del mes
    let current = new Date(
      startDateFormated.getFullYear(),
      startDateFormated.getMonth(),
      1
    );
    const end = new Date(
      endDateFormated.getFullYear(),
      endDateFormated.getMonth(),
      1
    );

    while (current <= end) {
      const month = current.getMonth();
      const year = current.getFullYear();
      const label = `${monthNames[month]} ${year}`;
      chartLabels.push(label);

      // Buscar si hay un dato en rawData para ese mes
      const row = rawData.find((r) => {
        const d = new Date(r.month);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      chartData.push(row ? parseInt(row.average_score) : 0);

      current.setMonth(current.getMonth() + 1);
    }

    return { chartData, chartLabels };
  }

  async getCaseStatusByMonth(
    user: userSession,
    startDate: string,
    endDate: string
  ): Promise<DashboardChartGroupBar> {
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
      .createQueryBuilder("ticket")
      .select([
        `EXTRACT(MONTH FROM ticket.createdAt) as month_num`,
        `EXTRACT(YEAR FROM ticket.createdAt) as year_num`,
        `ticket.ticketStateId as stateId`,
        `COUNT(*) as count`,
      ])
      .where("ticket.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("ticket.ticketStateId IN (:...stateIds)", {
        stateIds: Object.values(stateIds),
      })
      .groupBy("month_num, year_num, ticket.ticketStateId")
      .orderBy("year_num", "ASC")
      .addOrderBy("month_num", "ASC");

    this.applyUserFilters(query, user);

    const raw = await query.getRawMany();

    // Inicializa los arrays de datos por estado
    const dataByState: Record<string, number[]> = {};
    for (const name of stateNames) {
      dataByState[name] = Array(monthIndexMap.length).fill(0);
    }

    // Llena los datos en su índice correspondiente
    for (const row of raw) {
      const stateName = Object.keys(stateIds).find(
        (key) => stateIds[key] === row.stateid
      );
      if (!stateName) continue;

      const monthNum = parseInt(row.month_num, 10);
      const yearNum = parseInt(row.year_num, 10);

      const monthIndex = monthIndexMap.findIndex(
        (m) => m.month === monthNum && m.year === yearNum
      );

      if (monthIndex !== -1) {
        dataByState[stateName][monthIndex] = parseInt(row.count, 10);
      }
    }

    const totalCases = raw.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    return {
      title: "Estado de Casos",
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
    } = {}
  ): Promise<{
    data: DashboardChartGroupBar;
  }> {
    try {
      const { agentCount = 4, startDate, endDate, branchIds } = options;

      const endDateFormated = this.formatedEndDate(endDate);

      const cacheKey = `agent-performance:${
        user.id
      }:${agentCount}:${startDate}:${endDateFormated}:${
        branchIds?.join(",") || "all"
      }`;
      const cached = await this.cacheManager.getCache<{
        data: DashboardChartGroupBar;
      }>(cacheKey);
      if (cached) return cached;

      // 1. Obtener el ID del estado con mayor orden (el final)
      const lastState = await this.ticketStateService.findLastTicketState();

      if (!lastState) {
        throw new Error("No se pudo determinar el último estado de ticket");
      }

      const categories = this.generateMonthLabels(startDate, endDateFormated);

      // 2. Obtener todos los tickets del rango y su información
      const rawData = await this.ticketRepository
        .createQueryBuilder("ticket")
        .innerJoin("ticket.assignedUsers", "assignment")
        .innerJoin("assignment.user", "user")
        .innerJoin("user.role", "role")
        .innerJoin("ticket.ticketState", "state")
        .where("role.isAgent = true")
        // .andWhere('user.companyId = :companyId', { companyId: user.companyId })
        .andWhere("assignment.state = true")
        .andWhere("ticket.createdAt BETWEEN :startDate AND :endDate", {
          startDate: startDate,
          endDate: endDateFormated,
        })
        .andWhere("state.id = :lastStateId", { lastStateId: lastState.id })
        .andWhere(
          branchIds?.length ? "ticket.branchId IN (:...branchIds)" : "1=1",
          {
            branchIds,
          }
        )
        .select([
          "user.id as user_id",
          "user.name as user_name",
          "user.lastname as user_lastname",
          "EXTRACT(MONTH FROM ticket.createdAt) as month_num",
          "EXTRACT(YEAR FROM ticket.createdAt) as year_num",
          "COUNT(ticket.id) as count",
        ])
        .groupBy("user.id, user.name, user.lastname, month_num, year_num")
        .orderBy("year_num", "ASC")
        .addOrderBy("month_num", "ASC")
        .getRawMany();

      // 3. Agrupar por agente
      const agentMap: Record<string, { name: string; data: number[] }> = {};
      const agentIdsSeen: Set<string> = new Set();

      for (const row of rawData) {
        const agentId = row.user_id;
        const agentName = `${row.user_name} ${row.user_lastname}`;
        const label = this.formatMonthLabel(
          parseInt(row.month_num),
          parseInt(row.year_num)
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
        0
      );

      const result = {
        data: {
          title: "Rendimiento por Agente",
          description: `Total de tickets completados: ${totalTickets}`,
          categories,
          series,
        },
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error("Error en getAgentPerformance:", error);
      throw new InternalServerErrorException(
        "No se pudo obtener el rendimiento por agente."
      );
    }
  }

  private formatMonthLabel(month: number, year: number): string {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  private generateMonthLabels(startDate: string, endDate: string): string[] {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const labels: string[] = [];

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    let current = new Date(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      1
    );
    const end = new Date(
      parsedEndDate.getFullYear(),
      parsedEndDate.getMonth(),
      1
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
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}T23:59:59`;
  }

  private getMonthNamesBetween(
    startDate: string,
    endDate: string
  ): { label: string; month: number; year: number }[] {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const result: { label: string; month: number; year: number }[] = [];
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    const start = new Date(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      1
    );
    const end = new Date(
      parsedEndDate.getFullYear(),
      parsedEndDate.getMonth(),
      1
    );

    let current = new Date(start);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      console.error("Fechas inválidas:", { startDate, endDate });
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
