import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NoteAgentTicket } from './entities/note-agent-ticket.entity';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { CreateNoteAgentTicketDto } from './dto/create-note-agent-ticket.dto';

@Injectable()
export class NoteAgentTicketService {
  constructor(
    @InjectRepository(NoteAgentTicket)
    private readonly noteAgentTicketRepository: Repository<NoteAgentTicket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly cacheManager: CacheManagerService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateNoteAgentTicketDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const { userId, ticketId, description } = dto;

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) throw new BadRequestException(`Usuario con ID ${userId} no encontrado`);

      const ticket = await queryRunner.manager.findOne(Ticket, {
        where: { id: ticketId },
      });
      if (!ticket) throw new BadRequestException(`Ticket con ID ${ticketId} no encontrado`);

      const note = queryRunner.manager.create(NoteAgentTicket, {
        description,
        userId,
        ticketId,
      });

      const savedNote = await queryRunner.manager.save(note);
      await queryRunner.commitTransaction();

      await this.cacheManager.delCache(`notes:ticket:${ticketId}`);
      await this.cacheManager.delCache(`notes:user:${userId}`);

      return {
        data: savedNote,
        message: 'Nota creada exitosamente',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Error al crear la nota: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `notes:all:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache(cacheKey);
      if (cachedData) return cachedData;

      const query = this.noteAgentTicketRepository
        .createQueryBuilder('note')
        .leftJoinAndSelect('note.agent', 'user')
        .leftJoinAndSelect('note.ticket', 'ticket')
        .where('note.deletedAt IS NULL'); // Excluir eliminados

      if (filter) {
        query.andWhere(
          '(user.name LIKE :filter OR user.email LIKE :filter OR ticket.title LIKE :filter OR note.description LIKE :filter)',
          { filter: `%${filter}%` },
        );
      }

      query.skip(skip).take(take);
      const [notes, total] = await query.getManyAndCount();

      const result = {
        data: notes,
        total,
        message: 'Listado de notas',
      };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al obtener las notas: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<NoteAgentTicket> {
    try {
      const cacheKey = `note:${id}`;
      const cachedNote = await this.cacheManager.getCache<NoteAgentTicket>(cacheKey);
      if (cachedNote) return cachedNote;

      const note = await this.noteAgentTicketRepository.findOne({
        where: { id, deletedAt: null },
        relations: ['agent', 'ticket'],
      });

      if (!note) throw new NotFoundException(`Nota con ID ${id} no encontrada`);

      await this.cacheManager.setCache(cacheKey, note, CACHE_TTL);
      return note;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener la nota: ${error.message}`,
      );
    }
  }

  async findByTicketId(ticketId: string): Promise<NoteAgentTicket[]> {
    try {
      const cacheKey = `notes:ticket:${ticketId}`;
      const cachedData = await this.cacheManager.getCache<NoteAgentTicket[]>(cacheKey);
      if (cachedData) return cachedData;

      // Validar que el ticket existe
      await this.ticketRepository.findOneOrFail({ where: { id: ticketId } });

      const notes = await this.noteAgentTicketRepository.find({
        where: { ticketId, deletedAt: null },
        relations: ['agent'],
        order: { createdAt: 'DESC' },
      });

      await this.cacheManager.setCache(cacheKey, notes, CACHE_TTL);
      return notes;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);
      }
      throw new InternalServerErrorException(
        `Error al obtener las notas del ticket: ${error.message}`,
      );
    }
  }

  async findByUserId(userId: string): Promise<NoteAgentTicket[]> {
    try {
      const cacheKey = `notes:user:${userId}`;
      const cachedData = await this.cacheManager.getCache<NoteAgentTicket[]>(cacheKey);
      if (cachedData) return cachedData;

      // Validar que el usuario existe
      await this.userRepository.findOneOrFail({ where: { id: userId } });

      const notes = await this.noteAgentTicketRepository.find({
        where: { userId, deletedAt: null },
        relations: ['ticket'],
        order: { createdAt: 'DESC' },
      });

      await this.cacheManager.setCache(cacheKey, notes, CACHE_TTL);
      return notes;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }
      throw new InternalServerErrorException(
        `Error al obtener las notas del usuario: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const note = await this.noteAgentTicketRepository.findOne({ 
        where: { id, deletedAt: null } 
      });
      
      if (!note) throw new NotFoundException(`Nota con ID ${id} no encontrada`);

      await this.noteAgentTicketRepository.softDelete(id);

      // Invalidar cachés relevantes
      await this.cacheManager.delCache(`note:${id}`);
      await this.cacheManager.delCache(`notes:ticket:${note.ticketId}`);
      await this.cacheManager.delCache(`notes:user:${note.userId}`);
      await this.cacheManager.delCache('notes:all:*');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al eliminar la nota: ${error.message}`,
      );
    }
  }
}