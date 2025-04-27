import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketDetailService } from 'src/modules/ticket-detail/ticket-detail.service';
import { TicketDetailController } from 'src/modules/ticket-detail/ticket-detail.controller';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { TicketDetail } from 'src/modules/ticket-detail/entities/ticket-detail.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { TicketStateModule } from '../ticket-state/ticket-state.module';
import { TicketModule } from '../ticket/ticket.module';
import { EmailModule } from 'src/common/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketDetail]),  UsersModule, EmailModule, 
  TicketStateModule, TicketModule, CacheManagerModule],
  controllers: [TicketDetailController],
  providers: [TicketDetailService],
  exports: [TicketDetailService],
})
export class TicketDetailModule {}
