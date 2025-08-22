import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { columnDataFilter, columnDataOrder, userSession } from 'src/common/types';
import { PerformanceResponseDto } from './dto/performnce-response.dto';
import { multerOptions } from 'src/common/helpers/file-upload.helper';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseJsonPipe } from 'src/common/pipes/parse-json.pipe';
import { UpdateNoteAgentTicketDto } from '../note-agent-tickets/dto/update-note-agent-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Create a new ticket with form responses',
    description: 'Creates a new ticket and associates it with form responses in a single transaction'
  })
  @ApiBody({ 
    description: 'Ticket data including form responses', 
    type: CreateTicketDto 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Ticket and form responses created successfully',
    schema: {
      example: {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          ticketNumber: 1001,
          description: 'Problema de conexión',
          formResponse: {
            responses: { problema: 'Error 404', pasos: 'Intenté reiniciar el router' }
          }
        },
        message: 'Ticket created successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data or missing required fields' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error during creation' 
  })
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('createTicketDto', ParseJsonPipe) createTicketDto: Partial<CreateTicketDto>,
    @CurrentUser() user: userSession,
  ) {
    return await this.ticketService.create(createTicketDto, user, files);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all tickets with optional pagination' })
  @ApiQuery({
    name: 'skip',
    required: false,
    description:
      'The number of records to skip before starting to return results. Use this for pagination to retrieve data in chunks.',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description:
      'The maximum number of records to return in a single request. Use this to control the size of the response and improve performance.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Filter by description.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
  })
  async findAll(
    @CurrentUser() user: userSession,
    @Query('search') search?: string,
    @Query('stateId') stateId?: string,
    @Query('priorityId') priorityId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.ticketService.findAll(user, search, stateId, priorityId, branchId, startDate, endDate);
  }

  @Get('dashboard/cards')
  @ApiOperation({
    summary: 'Get dashboard statistics cards',
    description:
      'Returns key metrics for the dashboard including average response time, cases created, cases completed and customer satisfaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard cards data retrieved successfully',
    schema: {
      example: [
        {
          iconColor: 'gray',
          data: '15.2 min',
          title: 'Tiempo Promedio de Respuesta',
          icon: 'heroicons-outline:clock',
        },
        {
          iconColor: 'blue',
          data: 42,
          title: 'Casos Creados',
          icon: 'material-outline:note_add',
        },
        {
          iconColor: 'success',
          data: 35,
          title: 'Casos Completados',
          icon: 'material-outline:speaker_notes',
        },
        {
          iconColor: 'yellow',
          title: 'Satisfacción del Cliente',
          data: '4.5/5',
          icon: 'heroicons-outline:users',
        },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch dashboard statistics',
  })
  async getDashboardCards(
    @CurrentUser() user: userSession, 
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.ticketService.getDashboardCards(user, startDate, endDate);
  }

  @Get('dashboard/caseStateMonth')
  @ApiOperation({
    summary: 'Get case status by month',
    description:
      'Returns the number of cases grouped by status (e.g., Open, In Process, Assisted, Closed) for the current month.',
  })
  @ApiResponse({
    status: 200,
    description: 'Case status by month retrieved successfully',
    schema: {
      example: [
        { status: 'Open', count: 12 },
        { status: 'In Process', count: 8 },
        { status: 'Assisted', count: 5 },
        { status: 'Closed', count: 20 },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch case status by month',
  })
  async getCaseStatusByMonth(
    @CurrentUser() user: userSession,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.ticketService.getCaseStatusByMonth(user, startDate, endDate);
  }

  @Get('dashboard/averageResponse')
  @ApiOperation({
    summary: 'Get average response time for the last 7 days',
    description:
      'Returns the average time taken to respond to tickets each day over the last 7 days.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Average response time for the last 7 days retrieved successfully',
    schema: {
      example: [
        { date: '2024-05-01', averageMinutes: 12.3 },
        { date: '2024-05-02', averageMinutes: 15.6 },
        { date: '2024-05-03', averageMinutes: 14.1 },
        // ...
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch average response time',
  })
  async getAverageResponse(
    @CurrentUser() user: userSession,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.ticketService.getAverageResponse(user, startDate, endDate);
  }

  @Get('dashboard/ticketsByCategories')
  @ApiOperation({
    summary: 'Get ticket statistics by category',
    description:
      'Returns ticket count grouped by category for pie chart visualization',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket statistics by category retrieved successfully',
    schema: {
      example: {
        title: 'Tickets por Categoría',
        description: 'Total: 325 casos',
        categories: ['Hardware', 'Software', 'Desarrollo'],
        values: [150, 120, 55],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error while retrieving statistics',
  })
  async getTicketsByCategoryStats(    
    @CurrentUser() user: userSession, 
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.ticketService.getTicketsByCategoryStats(user, startDate, endDate);
  }

  @Get('dashboard/satisfactionIndicator')
  @ApiOperation({
    summary: 'Get satisfaction by semester',
    description: 'Returns satisfaction data',
  })
  @ApiResponse({
    status: 200,
    description: 'Semester satisfaction data obtained',
    schema: {
      example: {
        title: 'Satisfaction Indicator',
        description: 'Evaluation 1st Semester 2023',
        chartData: [80, 40, 85, 50, 89, 20],
        chartLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      },
    },
  })
  async getSatisfactionByRange(
    @CurrentUser() user: userSession,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    
    return this.ticketService.getSatisfactionByRange(user, startDate, endDate);
  }

  @Get('dashboard/performanceByAgent')
  @ApiOperation({
    summary: 'Get agent performance metrics',
    description: 'Returns performance data for top-performing agents based on resolved tickets within a given timeframe'
  })
  @ApiResponse({
    status: 200,
    description: 'Agent performance data',
    type: PerformanceResponseDto
  })
  @ApiResponse({ status: 400, description: 'User has no assigned company' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({
    name: 'agentCount',
    required: false,
    type: Number,
    description: 'Maximum number of agents to return (default: 4)'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Start date for filtering (ISO format)'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'End date for filtering (ISO format)'
  })
  @ApiQuery({
    name: 'branchIds',
    required: false,
    type: [String],
    description: 'Comma-separated branch IDs for filtering'
  })
  async getAgentPerformance(
    @CurrentUser() user: userSession,
    @Query('agentCount') agentCount?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchIds') branchIds?: string,
    @Query('agentSearch') agentSearch?: string,
    @Query('isAgentDefault') isAgentDefault?: boolean,
  ) {
    const branchIdsArray = branchIds ? branchIds.split(',') : undefined;

    return this.ticketService.getAgentPerformance(user, {
      agentCount,
      startDate ,
      endDate ,
      branchIds: branchIdsArray,
      agentSearch,
      isAgentDefault
    });

    
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to retrieve',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string) {
    return await this.ticketService.findOne(id);
  }

  @Patch('approved')
  @ApiOperation({
    summary: 'Actualizar estado de múltiples tickets a Abierto',
    description: `
      Actualiza el estado de uno o más tickets a "Abierto" y realiza las siguientes acciones:
      1. Cambia el estado del ticket al estado inicial definido en el sistema
      2. Crea una nota asociada al ticket con la descripción proporcionada
      3. Reasigna el ticket al agente actual si es necesario
      4. Envía notificaciones por correo al creador del ticket y al agente asignado
    `,
  })
  @ApiBody({
    description: 'IDs de los tickets a actualizar y la descripción de la nota',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          format: 'uuid',
          example: 
            '123e4567-e89b-12d3-a456-426614174000',
          
        },
        description: {
          type: 'string',
          example: 'Reabriendo los tickets para seguimiento adicional',
        },
      },
      required: ['ids', 'description'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tickets actualizados exitosamente',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Ticket) },
            },
            message: {
              type: 'string',
              example: 'Tickets abiertos correctamente. Algunas notificaciones por correo pudieron haber fallado.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async updateStatusToOpen(
    @CurrentUser() user: userSession,
    @Body() body: { ticketId: string; description: string }
  ) {
    return await this.ticketService.updateStatusToOpen(user, body.ticketId, body.description);
  }


  @Patch('inProcess/:id')
  @ApiOperation({ summary: 'Update ticket status to in Process' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update to in Process status',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated to In Process successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket or status not found' })
  @ApiResponse({ status: 500, description: 'Failed to update ticket status' })
  async updateStatusToInProcess(@Param('id') id: string) {
    return await this.ticketService.updateStatusToInProcess(id);
  }

  @Patch('assist/:id')
  @ApiOperation({ summary: 'Update ticket status to Assisted' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update to Assisted status',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated to Assisted successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket or status not found' })
  @ApiResponse({ status: 500, description: 'Failed to update ticket status' })
  async updateStatusToAssisted(@Param('id') id: string) {
    return await this.ticketService.updateStatusToAssisted(id);
  }

  @Patch('closet/:id')
  @ApiOperation({ summary: 'Update ticket status to Closet' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to update to Closet status',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated to Closet successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket or status not found' })
  @ApiResponse({ status: 500, description: 'Failed to update ticket status' })
  async updateStatusToCloseted(@Param('id') id: string) {
    return await this.ticketService.updateStatusToCloseted(id);
  }

  @Patch('rejected')
  @ApiOperation({
    summary: 'Rechazar ticket',
    description: `
      Cambia el estado de un ticket a "Rechazado", registra una nota con el motivo y notifica al usuario creador de cada ticket. 
      Si el correo falla, se informa en el mensaje de respuesta.`,
  })
  @ApiBody({
    description: 'ID de tickets a rechazar y motivo del rechazo',
    schema: {
      type: 'object',
      properties: {
        id: {
          
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          
        },
        description: {
          type: 'string',
          description: 'Motivo detallado del rechazo',
          example: 'El ticket no cumple con los requisitos establecidos.',
          minLength: 10,
          maxLength: 1000,
        },
      },
      required: ['ids', 'description'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket rechazado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Ticket' },
        },
        message: {
          type: 'string',
          description: 'Ticket fue rechazado y notificado correctamente.',
          
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Debe proporcionar al menos un ID y una descripción válida.',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o no proporcionado',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    content: {
      'application/json': {
        examples: {
          ticketNotFound: {
            value: {
              statusCode: 404,
              message: 'Uno o más tickets no fueron encontrados',
              error: 'Not Found',
            },
          },
          stateNotFound: {
            value: {
              statusCode: 404,
              message: 'Estado "Rechazado" no configurado en el sistema',
              error: 'Not Found',
            },
          },
          userNotFound: {
            value: {
              statusCode: 404,
              message: 'Uno o más usuarios asociados no fueron encontrados',
              error: 'Not Found',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'Error al procesar el rechazo de los tickets',
          error: 'Internal Server Error',
        },
      },
    },
  })
  async updateStatusToRejected(
    @CurrentUser() user: userSession,
    @Body()
    body: {
      ticketId: string;
      description: string;
    },
  ) {
    return this.ticketService.updateStatusToRejected(user, body.ticketId, body.description);
  }


  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update a ticket and its form responses',
    description: 'Updates ticket details and associated form responses atomically'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID of the ticket to update', 
    example: '550e8400-e29b-41d4-a716-446655440000' 
  })
  @ApiBody({ 
    description: 'Ticket update data including form responses', 
    type: UpdateTicketDto 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ticket and form responses updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ticketNumber: 1001,
        description: 'Problema de conexión actualizado',
        formResponse: {
          responses: { problema: 'Error 500', pasos: 'Reinicié el sistema' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Ticket not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Failed to update ticket or form responses' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the ticket to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async remove(@Param('id') id: string) {
    return await this.ticketService.remove(id);
  }
}
