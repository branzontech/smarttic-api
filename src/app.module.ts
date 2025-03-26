import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerHelper } from './common/helpers/logger.helper';
import { HttpCatchErrorFilter } from './common/filters/http-catch-error.filter';
import { AuditsModule } from './modules/audits/audits.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './common/database/database.module';
import { IdentificationTypeModule } from './modules/identification-type/identification-type.module'
import { BranchModule } from './modules/branch/branch.module';
import { AssignedUserBranchModule } from "src/modules/assigned-user-branch/assigned-user-branch.module";
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
    AssignedUserBranchModule
  ],
  controllers: [],
  providers: [
    LoggerHelper,  // Registrar LoggerHelper
    HttpCatchErrorFilter,  // Registrar el filtro para que NestJS lo maneje
  ],
})
export class AppModule {}
