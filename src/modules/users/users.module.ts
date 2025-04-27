import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { UsersController } from 'src/modules/users/users.controller';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { AssignedUserBranchModule } from 'src/modules/assigned-user-branch/assigned-user-branch.module';
import { BranchService } from '../branch/branch.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]),  AssignedUserBranchModule, CacheManagerModule], // Registrar las entidades
  controllers: [UsersController], // Registrar el controlador
  providers: [UsersService, BranchService], // Registrar el servicio
  exports: [UsersService, TypeOrmModule], 
})
export class UsersModule {}
