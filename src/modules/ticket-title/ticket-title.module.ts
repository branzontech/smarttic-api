import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTitleService } from 'src/modules/ticket-title/ticket-title.service';
import { TicketTitleController } from 'src/modules/ticket-title/ticket-title.controller';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TicketCategoryModule } from 'src/modules/ticket-category/ticket-category.module';
import { TicketPriorityModule } from 'src/modules/ticket-priority/ticket-priority.module';
import { UsersModule } from 'src/modules/users/users.module';


@Module({
  imports: [TypeOrmModule.forFeature([TicketTitle]), TicketCategoryModule, TicketPriorityModule, UsersModule, CacheManagerModule],
  controllers: [TicketTitleController],
  providers: [TicketTitleService],
  exports: [TicketTitleService],
})
export class TicketTitleModule {}
