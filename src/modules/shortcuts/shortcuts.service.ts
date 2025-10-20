import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Shortcut } from './entities/shortcut.entity';
import { CreateShortcutDto } from './dto/create-shortcut.dto';
import { userSession } from 'src/common/types';
import { Menu } from 'src/modules/menu/entities/menu.entity';

@Injectable()
export class ShortcutsService {
  constructor(
    @InjectRepository(Shortcut)
    private readonly shortcutRepo: Repository<Shortcut>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
  ) {}

  async assignShortcuts(user: userSession, menuIds: string[]) {
    await this.shortcutRepo.delete({ userId:  user.id  });

    if (menuIds && menuIds.length > 0) {
      const menus = await this.menuRepo.find({
        where: { id: In(menuIds) },
      });

      const foundIds = menus.map((menu) => menu.id);
      const notFoundIds = menuIds.filter((id) => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        throw new Error(
          `Los siguientes menus no existen: ${notFoundIds.join(', ')}`,
        );
      }


      const shortcuts = menus.map((menu) =>
        this.shortcutRepo.create({
          userId: user.id,
          menuId: menu.id,
        }),
      );

      return await this.shortcutRepo.save(shortcuts);
    }

    return [];
  }
}
