import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyCalificationService } from 'src/modules/survey-calification/survey-calification.service';
import { SurveyCalificationController } from 'src/modules/survey-calification/survey-calification.controller';
import { SurveyCalification } from 'src/modules/survey-calification/entities/survey-calification.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyCalification]), UsersModule, CacheManagerModule],
  controllers: [SurveyCalificationController],
  providers: [SurveyCalificationService],
  exports: [SurveyCalificationService],
})
export class SurveyCalificationModule {}
