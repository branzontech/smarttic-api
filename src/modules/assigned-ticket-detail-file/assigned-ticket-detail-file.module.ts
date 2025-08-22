import { Module } from '@nestjs/common';
import { AssignedTicketDetailFileService } from './assigned-ticket-detail-file.service';
import { AssignedTicketDetailFileController } from './assigned-ticket-detail-file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedTicketDetailFile } from './entities/assigned-ticket-detail-file.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TicketDetailModule } from '../ticket-detail/ticket-detail.module';
import { TicketFilesModule } from '../ticket-files/ticket-files.module';


@Module({
  imports: [TypeOrmModule.forFeature([AssignedTicketDetailFile]), CacheManagerModule],
  controllers: [AssignedTicketDetailFileController],
  providers: [AssignedTicketDetailFileService],
  exports: [AssignedTicketDetailFileService, TypeOrmModule],
})
export class AssignedTicketDetailFileModule {}
