import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateNoteAgentTicketDto } from './dto/create-note-agent-ticket.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NoteAgentTicket } from './entities/note-agent-ticket.entity';
import { NoteAgentTicketService } from './note-agent-tickets.service';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiTags('Notes Agent Tickets')
@ApiBearerAuth('access-token')
@Controller('notesAgentTickets')
@UseGuards(AuthzGuard)
export class NoteAgentTicketController {
  constructor(private readonly noteAgentTicketService: NoteAgentTicketService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva nota de agente en ticket',
    description: 'Crea una nueva nota asociada a un ticket y un usuario agente',
  })
  @ApiBody({
    description: 'Datos para crear la nota',
    type: CreateNoteAgentTicketDto,
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Nota creada exitosamente',
    type: NoteAgentTicket
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de solicitud inválidos o usuario/ticket no encontrado' 
  })
  async create(@Body() createNoteAgentTicketDto: CreateNoteAgentTicketDto) {
    return await this.noteAgentTicketService.create(createNoteAgentTicketDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las notas de agentes en tickets con paginación',
    description: 'Devuelve una lista paginada de todas las notas de agentes en tickets del sistema',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Número de registros a omitir para paginación',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Número máximo de registros a devolver',
    example: 10,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filtrar notas por nombre de agente, email, título de ticket o contenido de nota',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notas recuperadas exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/NoteAgentTicket' } },
        total: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 10,
    @Query('filter') filter?: string,
  ) {
    return await this.noteAgentTicketService.findAll(skip, take, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una nota específica de agente en ticket por ID',
    description: 'Recupera los detalles de una sola nota de agente en ticket',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la nota a recuperar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nota recuperada exitosamente',
    type: NoteAgentTicket
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nota no encontrada' 
  })
  async findById(@Param('id') id: string) {
    return await this.noteAgentTicketService.findById(id);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({
    summary: 'Obtener todas las notas para un ticket específico',
    description: 'Recupera todas las notas asociadas a un ticket particular',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'UUID del ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notas recuperadas exitosamente',
    type: [NoteAgentTicket]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Ticket no encontrado' 
  })
  async findByTicketId(@Param('ticketId') ticketId: string) {
    return await this.noteAgentTicketService.findByTicketId(ticketId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obtener todas las notas creadas por un usuario específico',
    description: 'Recupera todas las notas creadas por un agente/usuario particular',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID del usuario/agente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notas recuperadas exitosamente',
    type: [NoteAgentTicket]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado' 
  })
  async findByUserId(@Param('userId') userId: string) {
    return await this.noteAgentTicketService.findByUserId(userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una nota de agente en ticket',
    description: 'Elimina suavemente una nota específica de agente en ticket por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la nota a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nota eliminada exitosamente' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nota no encontrada' 
  })
  async remove(@Param('id') id: string) {
    return await this.noteAgentTicketService.remove(id);
  }
}