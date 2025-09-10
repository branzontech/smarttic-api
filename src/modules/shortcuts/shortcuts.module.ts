import { Module } from '@nestjs/common';
import { ShortcutsService } from './shortcuts.service';
import { ShortcutsController } from './shortcuts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shortcut } from './entities/shortcut.entity';
import { UsersModule } from '../users/users.module';
import { MenuModule } from '../menu/menu.module';
import { Menu } from '../menu/entities/menu.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shortcut, Menu]), UsersModule,  CacheManagerModule,  MenuModule],
  controllers: [ShortcutsController],
  providers: [ShortcutsService],
  exports: [ShortcutsService]
})
export class ShortcutsModule {}
