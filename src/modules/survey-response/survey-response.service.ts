import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { CreateSurveyResponseDto } from 'src/modules/survey-response/dto/create-survey-response.dto';
import { UpdateSurveyResponseDto } from 'src/modules/survey-response/dto/update-survey-response.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { userSession } from 'src/common/types';
import { WebsocketService } from 'src/common/websocket/websocket.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SurveyResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: Repository<SurveyResponse>,
    private readonly cacheManager: CacheManagerService,
    private readonly websocketService: WebsocketService,
  ) {}

  async create(
    createSurveyResponseDto: CreateSurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const existingResponse = await this.surveyResponseRepository.findOne({
        where: {
          userId: createSurveyResponseDto.userId,
          surveyCalificationId: createSurveyResponseDto.surveyCalificationId,
          ticketId: createSurveyResponseDto.ticketId,
        },
      });
  
      if (existingResponse) {
        throw new ConflictException(
          'The user has already responded to this survey.',
        );
      }
  
      const response = this.surveyResponseRepository.create(createSurveyResponseDto);
      const saved = await this.surveyResponseRepository.save(response);
      this.websocketService.emit('ticket-surverResponse', createSurveyResponseDto);
      await this.cacheManager.delCache('surveyResponses:*');
  
      return saved;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
  
      console.error('Error in create:', error);
      throw new InternalServerErrorException(
        'Failed to create the survey response.',
      );
    }
  }
  

  async findAll(
    user: userSession,
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: SurveyResponse[]; total: number }> {
    const { isAdmin, isConfigurator } = user.role;
    const cacheKey = `surveyResponses:userId:${user.id}:skip:${skip}:take:${take}:filter:${filter || ''}`;

    try {
      const cached = await this.cacheManager.getCache<{
        data: SurveyResponse[];
        total: number;
      }>(cacheKey);
      if (cached) return cached;

      const queryBuilder =
        this.surveyResponseRepository.createQueryBuilder('surveyResponse')
        .leftJoinAndSelect('surveyResponse.user', 'user')
        .leftJoinAndSelect('user.company', 'company')
        .leftJoinAndSelect('user.branch', 'branch')
        .leftJoinAndSelect('surveyResponse.ticket', 'ticket')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
        .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers', 'assignedUsers.state = true')
        .leftJoinAndSelect('assignedUsers.user', 'agent')
        .leftJoinAndSelect('surveyResponse.surveyCalification', 'surveyCalification');

      if (filter) {
        queryBuilder.andWhere(
          `ticketTitle.description ILIKE :filter OR 
           surveyCalification.title ILIKE :filter OR 
           ticketPriority.title ILIKE :filter OR
           branch.name ILIKE :filter OR 
           CONCAT(ticketCategory.prefix, '-', ticket.ticketNumber) ILIKE :filter OR
           CONCAT(user.name, ' ', user.lastname) ILIKE :filter OR
           CONCAT(agent.name, ' ', agent.lastname) ILIKE :filter
           `,
          {
            filter: `%${filter}%`,
          },
        );
      }

      if (isAdmin && !isConfigurator) {
        queryBuilder.andWhere(
          `user.branchId = :branchId`,
          {
            branchId: `${user.branchId}`,
          },
        );
      }

      queryBuilder.orderBy('surveyResponse.createdAt', 'DESC').skip(skip).take(take);

      const [surveyCalifications, total] = await queryBuilder.getManyAndCount();
      const result = { data: surveyCalifications, total };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve the list of survey responses.',
      );
    }
  }

  async findAllExcel(
    user: userSession,
    filter?: string,
  ){
    const { isAdmin, isConfigurator } = user.role;
    try {

      const queryBuilder =
        this.surveyResponseRepository.createQueryBuilder('surveyResponse')
        .leftJoinAndSelect('surveyResponse.user', 'user')
        .leftJoinAndSelect('user.company', 'company')
        .leftJoinAndSelect('user.branch', 'branch')
        .leftJoinAndSelect('surveyResponse.ticket', 'ticket')
        .leftJoinAndSelect('ticket.ticketState', 'ticketState')
        .leftJoinAndSelect('ticket.ticketTitle', 'ticketTitle')
        .leftJoinAndSelect('ticketTitle.ticketCategory', 'ticketCategory')
        .leftJoinAndSelect('ticketTitle.ticketPriority', 'ticketPriority')
        .leftJoinAndSelect('ticket.assignedUsers', 'assignedUsers', 'assignedUsers.state = true')
        .leftJoinAndSelect('assignedUsers.user', 'agent')
        .leftJoinAndSelect('surveyResponse.surveyCalification', 'surveyCalification');

      if (filter) {
        queryBuilder.andWhere(
          `ticketTitle.description ILIKE :filter OR 
           surveyCalification.title ILIKE :filter OR 
           ticketPriority.title ILIKE :filter OR
           branch.name ILIKE :filter OR 
           CONCAT(ticketCategory.prefix, '-', ticket.ticketNumber) ILIKE :filter OR
           CONCAT(user.name, ' ', user.lastname) ILIKE :filter OR
           CONCAT(agent.name, ' ', agent.lastname) ILIKE :filter
           `,
          {
            filter: `%${filter}%`,
          },
        );
      }

      if (isAdmin && !isConfigurator) {
        queryBuilder.andWhere(
          `user.branchId = :branchId`,
          {
            branchId: `${user.branchId}`,
          },
        );
      }

      queryBuilder.orderBy('surveyResponse.createdAt', 'DESC');

      const [surveyCalifications, total] = await queryBuilder.getManyAndCount();
      

     const buffer= await this.generateSuverResponsesExcel(surveyCalifications);
     return new StreamableFile(buffer, {
               type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               disposition: `attachment; filename="survey_response.xlsx"`,
             }); 
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve the list of survey responses.',
      );
    }
  }

  async findOne(id: string): Promise<SurveyResponse> {
    const cacheKey = `surveyResponse:${id}`;

    try {
      const cached = await this.cacheManager.getCache<SurveyResponse>(cacheKey);
      if (cached) return cached;

      const response = await this.surveyResponseRepository.findOne({
        where: { id },
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      await this.cacheManager.setCache(cacheKey, response, CACHE_TTL);

      return response;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve the survey response.',
      );
    }
  }

  async update(
    id: string,
    updateSurveyResponseDto: UpdateSurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const response = await this.surveyResponseRepository.preload({
        id,
        ...updateSurveyResponseDto,
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      const updated = await this.surveyResponseRepository.save(response);

      await Promise.all([
        this.cacheManager.delCache(`surveyResponse:${id}`),
        this.cacheManager.delCache('surveyResponses:*'),
      ]);

      return updated;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException(
        'Failed to update the survey response.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const response = await this.surveyResponseRepository.findOne({
        where: { id },
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      await this.surveyResponseRepository.softRemove(response);

      await Promise.all([
        this.cacheManager.delCache(`surveyResponse:${id}`),
        this.cacheManager.delCache('surveyResponses:*'),
      ]);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException(
        'Failed to delete the survey response.',
      );
    }
  }

  private async generateSuverResponsesExcel(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Encuestas');


    worksheet.mergeCells('A1', 'I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Encuestas de Satisfacción';
    titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B2C35' },
    };
    worksheet.getRow(1).height = 55;

    const headerRow = worksheet.addRow([
      'Ticket',
      'Título',
      'Categoría',
      'Usuario',
      'Agente',
      'Sucursal',
      'Respuesta',
      'Prioridad',
      'Fecha creación',
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B2C35' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    worksheet.getRow(2).height = 30;

    data.forEach((row, index) => {
      const ticket = row.ticket || {};
      const cliente = row.user || {};
      const agente = ticket.assignedUsers?.[0]?.user || {};
      const prioridad = ticket.ticketTitle?.ticketPriority || {};

      const newRow = worksheet.addRow([
        `${ticket.ticketTitle?.ticketCategory?.prefix || ''}-${ticket.ticketNumber || ''}`,
        ticket.ticketTitle?.description || '',
        ticket.ticketTitle?.ticketCategory?.description || '',
        `${cliente.name || ''} ${cliente.lastname || ''}`.trim(),
        `${agente.name || ''} ${agente.lastname || ''}`.trim(),
        cliente.branch?.name || 'No aplica',
        row.surveyCalification?.title || '',
        prioridad?.title || '',
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]);

      const bgColor = index % 2 === 0 ? 'F0FCB8' : 'EFFFD9';
      newRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });


    worksheet.columns.forEach((col) => (col.width = 22));

    const footerRow = worksheet.addRow([]);
    footerRow.getCell(1).value = `Generado el: ${new Date().toLocaleString()}`;
    worksheet.mergeCells(`A${footerRow.number}:I${footerRow.number}`);
    footerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    footerRow.getCell(1).font = { italic: true, color: { argb: 'FFFFFFFF' } };
    footerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B2C35' },
    };
    footerRow.height = 25;

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

}
