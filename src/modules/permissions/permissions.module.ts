import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { PermissionsController } from 'src/modules/permissions/permissions.controller';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Permission]), CacheManagerModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService], //
})
export class PermissionsModule {}
