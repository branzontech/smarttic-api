import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from 'src/modules/ticket/ticket.service';
import { TicketController } from 'src/modules/ticket/ticket.controller';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { TicketState } from 'src/modules/ticket-state/entities/ticket-state.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { TicketStateModule } from '../ticket-state/ticket-state.module';
import { EmailModule } from 'src/common/email/email.module';
import { AssignedUserTicketModule } from '../assigned-user-ticket/assigned-user-ticket.module';
import { SurveyResponseModule } from '../survey-response/survey-response.module';
import { TicketDetailModule } from '../ticket-detail/ticket-detail.module';
import { BranchModule } from '../branch/branch.module';
import { FormResponsesModule } from '../form-responses/form-responses.module';
import { FormResponse } from '../form-responses/entities/form-response.entity';
import { FormResponseFilesModule } from '../form-response-files/form-response-files.module';
import { FormResponseFile } from '../form-response-files/entities/form-response-file.entity';
import { TicketTitleModule } from '../ticket-title/ticket-title.module';
import { LaborHoursModule } from '../labor-hours/labor-hours.module';
import { HolidaysModule } from '../holidays/holidays.module';



@Module({
  imports: [ TypeOrmModule.forFeature([Ticket, TicketTitle, TicketState, FormResponse, FormResponseFile]), FormResponseFilesModule,
  UsersModule, CacheManagerModule, TicketStateModule, TicketTitleModule, AssignedUserTicketModule, BranchModule, FormResponsesModule,
    forwardRef(() => SurveyResponseModule), EmailModule, forwardRef(() => TicketDetailModule), LaborHoursModule, HolidaysModule ],
  controllers: [TicketController],
  providers: [TicketService ],
  exports: [TicketService],
})
export class TicketModule {}
