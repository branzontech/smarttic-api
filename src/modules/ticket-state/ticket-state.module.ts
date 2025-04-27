import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketStateService } from 'src/modules/ticket-state/ticket-state.service';
import { TicketStateController } from 'src/modules/ticket-state/ticket-state.controller';
import { TicketState } from 'src/modules/ticket-state/entities/ticket-state.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketState]), UsersModule, CacheManagerModule],
  controllers: [TicketStateController],
  providers: [TicketStateService],
  exports: [TicketStateService]
})
export class TicketStateModule {}
