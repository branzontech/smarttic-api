import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from 'src/modules/ticket/ticket.service';
import { TicketController } from 'src/modules/ticket/ticket.controller';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { TicketState } from 'src/modules/ticket-state/entities/ticket-state.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { TicketStateModule } from '../ticket-state/ticket-state.module';
import { EmailModule } from 'src/common/email/email.module';
import { AssignedUserTicketModule } from '../assigned-user-ticket/assigned-user-ticket.module';


@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketTitle, TicketState]), 
  UsersModule, CacheManagerModule, TicketStateModule, AssignedUserTicketModule, EmailModule],
  controllers: [TicketController],
  providers: [TicketService ],
  exports: [TicketService],
})
export class TicketModule {}
