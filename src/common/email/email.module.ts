import { Module } from '@nestjs/common';
import { EmailService } from 'src/common/email/email.service';
import { SurveyCalificationModule } from 'src/modules/survey-calification/survey-calification.module';

@Module({
  imports: [SurveyCalificationModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}