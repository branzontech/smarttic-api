import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketPriorityService } from 'src/modules/ticket-priority/ticket-priority.service';
import { TicketPriorityController } from 'src/modules/ticket-priority/ticket-priority.controller';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TicketPriority } from 'src/modules/ticket-priority/entities/ticket-priority.entity';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketPriority]), UsersModule, CacheManagerModule],
  controllers: [TicketPriorityController],
  providers: [TicketPriorityService],
  exports:[TicketPriorityService]
})
export class TicketPriorityModule {}
