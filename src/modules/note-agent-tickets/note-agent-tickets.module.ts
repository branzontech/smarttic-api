import { Module } from '@nestjs/common';
import { NoteAgentTicketService } from './note-agent-tickets.service';
import { NoteAgentTicketController } from './note-agent-tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteAgentTicket } from './entities/note-agent-ticket.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../ticket/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, User, NoteAgentTicket]), UsersModule, CacheManagerModule],
  controllers: [NoteAgentTicketController],
  providers: [NoteAgentTicketService],
  exports: [NoteAgentTicketService],
})
export class NoteAgentTicketsModule {}
