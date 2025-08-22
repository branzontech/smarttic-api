import { Module } from '@nestjs/common';
import { TicketFilesService } from './ticket-files.service';
import { TicketFilesController } from './ticket-files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketFile } from './entities/ticket-file.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
      TypeOrmModule.forFeature([TicketFile]),
      UsersModule,
      CacheManagerModule,
    ],
  controllers: [TicketFilesController],
  providers: [TicketFilesService],
  exports:[TicketFilesService, TypeOrmModule,]
})
export class TicketFilesModule {}
