import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyResponseService } from 'src/modules/survey-response/survey-response.service';
import { SurveyResponseController } from 'src/modules/survey-response/survey-response.controller';
import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { TicketModule } from '../ticket/ticket.module';
import { SurveyCalificationModule } from '../survey-calification/survey-calification.module';
import { WebsocketModule } from 'src/common/websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyResponse]),  WebsocketModule,
  UsersModule,  forwardRef(() => TicketModule), 
  SurveyCalificationModule, CacheManagerModule],
  controllers: [SurveyResponseController],
  providers: [SurveyResponseService],
  exports: [SurveyResponseService, TypeOrmModule], 
})
export class SurveyResponseModule {}
