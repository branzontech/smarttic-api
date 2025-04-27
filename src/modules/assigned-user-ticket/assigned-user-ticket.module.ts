import { Module } from '@nestjs/common';
import { AssignedUserTicketService } from './assigned-user-ticket.service';
import { AssignedUserTicketController } from './assigned-user-ticket.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedUserTicket } from './entities/assigned-user-ticket.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, User, AssignedUserTicket]),
    CacheManagerModule,
  ],
  controllers: [AssignedUserTicketController],
  providers: [AssignedUserTicketService],
  exports: [AssignedUserTicketService, TypeOrmModule],
})
export class AssignedUserTicketModule {}
