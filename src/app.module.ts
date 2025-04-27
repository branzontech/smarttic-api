import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerHelper } from 'src/common/helpers/logger.helper';
import { HttpCatchErrorFilter } from 'src/common/filters/http-catch-error.filter';
import { AuditsModule } from 'src/modules/audits/audits.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { IdentificationTypeModule } from 'src/modules/identification-type/identification-type.module'
import { BranchModule } from 'src/modules/branch/branch.module';
import { AssignedUserBranchModule } from "src/modules/assigned-user-branch/assigned-user-branch.module";
import { TicketTitleModule } from 'src/modules/ticket-title/ticket-title.module';
import { TicketCategoryModule } from 'src/modules/ticket-category/ticket-category.module';
import { TicketStateModule } from 'src/modules/ticket-state/ticket-state.module';
import { TicketPriorityModule } from 'src/modules/ticket-priority/ticket-priority.module';
import { TicketModule } from 'src/modules/ticket/ticket.module';
import { TicketDetailModule } from 'src/modules/ticket-detail/ticket-detail.module';
import { SurveyCalificationModule } from 'src/modules/survey-calification/survey-calification.module';
import { SurveyResponseModule } from 'src/modules/survey-response/survey-response.module';
import { MenuModule } from './modules/menu/menu.module';
import { AssignedMenuRoleModule } from './modules/assigned-menu-role/assigned-menu-role.module';
import { AssignedUserTicketModule } from './modules/assigned-user-ticket/assigned-user-ticket.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local', // Especifica el archivo
      isGlobal: true, // Permite que el módulo sea accesible en toda la aplicación
    }),
    DatabaseModule,
    AuditsModule, 
    AuthModule,
    PermissionsModule, 
    RolesModule, 
    IdentificationTypeModule,
    UsersModule,
    BranchModule,
    AssignedUserBranchModule,
    TicketTitleModule,
    TicketCategoryModule,
    TicketStateModule,
    TicketPriorityModule,
    TicketModule,
    TicketDetailModule,
    SurveyCalificationModule,
    SurveyResponseModule,
    MenuModule,
    AssignedMenuRoleModule,
    AssignedUserTicketModule
  ],
  controllers: [],
  providers: [
    LoggerHelper,  // Registrar LoggerHelper
    HttpCatchErrorFilter,  // Registrar el filtro para que NestJS lo maneje
  ],
})
export class AppModule {}
