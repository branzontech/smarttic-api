import { Module } from '@nestjs/common';
import { AssignedTicketFileService } from './assigned-ticket-file.service';
import { AssignedTicketFileController } from './assigned-ticket-file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedTicketFile } from './entities/assigned-ticket-file.entity';
import { TicketFilesModule } from '../ticket-files/ticket-files.module';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedTicketFile]), CacheManagerModule],
  controllers: [AssignedTicketFileController],
  providers: [AssignedTicketFileService],
  exports: [AssignedTicketFileService, TypeOrmModule],
})
export class AssignedTicketFileModule {}
