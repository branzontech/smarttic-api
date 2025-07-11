import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from 'src/modules/menu/menu.service';
import { MenuController } from 'src/modules/menu/menu.controller';
import { Menu } from 'src/modules/menu/entities/menu.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AssignedMenuRoleModule } from '../assigned-menu-role/assigned-menu-role.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), UsersModule, 
  forwardRef(() => AssignedMenuRoleModule), CacheManagerModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
