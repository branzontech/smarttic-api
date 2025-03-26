import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { UsersController } from 'src/modules/users/users.controller';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]),CacheManagerModule], // Registrar las entidades
  controllers: [UsersController], // Registrar el controlador
  providers: [UsersService], // Registrar el servicio
  exports: [UsersService, TypeOrmModule], 
})
export class UsersModule {}
