import { Module } from '@nestjs/common';
import { FormResponsesService } from './form-responses.service';
import { FormResponsesController } from './form-responses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { FormResponse } from './entities/form-response.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([FormResponse]), CacheManagerModule, UsersModule],
  controllers: [FormResponsesController],
  providers: [FormResponsesService],
  exports: [FormResponsesService],
})
export class FormResponsesModule {}
