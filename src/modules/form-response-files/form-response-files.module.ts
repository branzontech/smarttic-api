import { Module } from '@nestjs/common';
import { FormResponseFilesService } from './form-response-files.service';
import { FormResponseFilesController } from './form-response-files.controller';
import { FormResponseFile } from './entities/form-response-file.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormResponsesModule } from '../form-responses/form-responses.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([FormResponseFile]), CacheManagerModule, FormResponsesModule, UsersModule ],
  controllers: [FormResponseFilesController],
  providers: [FormResponseFilesService],
  exports: [FormResponseFilesService],
})
export class FormResponseFilesModule {}
