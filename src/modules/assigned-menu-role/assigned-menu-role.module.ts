import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedMenuRoleService } from 'src/modules/assigned-menu-role/assigned-menu-role.service';
import { AssignedMenuRoleController } from 'src/modules/assigned-menu-role/assigned-menu-role.controller';
import { AssignedMenuRole } from 'src/modules/assigned-menu-role/entities/assigned-menu-role.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { MenuModule } from 'src/modules/menu/menu.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedMenuRole]), RolesModule, MenuModule, UsersModule, CacheManagerModule],
  controllers: [AssignedMenuRoleController],
  providers: [AssignedMenuRoleService],
  exports: [AssignedMenuRoleService],
})
export class AssignedMenuRoleModule {}
