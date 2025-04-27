import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketCategoryService } from 'src/modules/ticket-category/ticket-category.service';
import { TicketCategoryController } from 'src/modules/ticket-category/ticket-category.controller';
import { TicketCategory } from 'src/modules/ticket-category/entities/ticket-category.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketCategory]), CacheManagerModule, UsersModule],
  controllers: [TicketCategoryController],
  providers: [TicketCategoryService],
  exports: [TicketCategoryService],
})
export class TicketCategoryModule {}
