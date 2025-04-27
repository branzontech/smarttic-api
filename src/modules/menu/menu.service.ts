import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from 'src/modules/menu/entities/menu.entity';
import { CreateMenuDto } from 'src/modules/menu/dto/create-menu.dto';
import { UpdateMenuDto } from 'src/modules/menu/dto/update-menu.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    try {
      if (createMenuDto.nameView) {
        const existingMenu = await this.menuRepository.findOne({
          where: { nameView: createMenuDto.nameView },
        });
        if (existingMenu) {
          throw new ConflictException(
            `NameView '${createMenuDto.nameView}' already exists.`,
          );
        }
      }

      const menu = this.menuRepository.create(createMenuDto);
      const savedMenu = await this.menuRepository.save(menu);
      await this.cacheManager.delCache('menus:*');
      return savedMenu;
    } catch (error) {
      console.error('Error in create:', error);

      if (error instanceof ConflictException) {
        throw error;
      }

      // Si no es una excepción manejada, lanzamos un InternalServerErrorException.
      throw new InternalServerErrorException('Could not create the menu.');
    }
  }

  async findMenusFather(): Promise<{ data: Menu[] }> {
    try {
      const menus = await this.menuRepository
        .createQueryBuilder('menu')
        .leftJoin('menu.parent', 'parent')
        .select([
          'menu.id AS id',
          `CASE 
            WHEN parent.description IS NOT NULL 
            THEN CONCAT(parent.description, ' - ', menu.description) 
            ELSE menu.description 
         END AS description`,
        ])
        .where('menu.nameView IS NULL')
        .andWhere('menu.state = true')
        .andWhere('menu.deletedAt IS NULL')
        .getRawMany();

      return { data: menus };
    } catch (error) {
      console.error('Error in findMenusFather:', error);
      throw new InternalServerErrorException(
        'Could not retrieve menus by role ID.',
      );
    }
  }

  async findMenusByRoleId(roleId: string): Promise<Menu[]> {
    try {
      const menus = await this.menuRepository.find({
        where: {
          deletedAt: null,
          assignedMenuRoles: {
            role: {
              id: roleId,
              state: true,
              deletedAt: null,
            },
          },
        },
        relations: ['assignedMenuRoles', 'assignedMenuRoles.role'],
        select: {
          id: true,
          description: true,
          nameView: true,
          classIcon: true,
          orderItem: true,
          father: true,
        },
        order: { orderItem: 'ASC' },
      });
      return menus;
    } catch (error) {
      console.error('Error in findMenusByRoleId:', error);
      throw new InternalServerErrorException(
        'Could not retrieve menus by role ID.',
      );
    }
  }

  async findAllMenusPermissionByRoleId(
    roleId: string,
  ): Promise<{ data: (Menu & { selected: boolean })[] }> {
    try {
      // 1. Obtener todos los menús activos
      const allMenus = await this.menuRepository.find({
        where: {
          deletedAt: null,
          state: true,
        },
        relations: {
          assignedMenuRoles: {
            role: true,
          },
        },
        select: {
          id: true,
          description: true,
          nameView: true,
          classIcon: true,
          orderItem: true,
          father: true,
          assignedMenuRoles: {
            id: true,
            role: {
              id: true,
              state: true,
              deletedAt: null,
            },
          },
        },
        order: { orderItem: 'ASC' },
      });

      const menusWithSelection = allMenus.map((menu) => {
        const isSelected = menu.assignedMenuRoles?.some(
          (assigned) =>
            assigned.role?.id === roleId &&
            assigned.role?.state === true &&
            assigned.role?.deletedAt === null,
        );

        return {
          ...menu,
          selected: isSelected,
        };
      });

      return { data: menusWithSelection };
    } catch (error) {
      console.error('Error in findAllMenusWithSelectionByRoleId:', error);
      throw new InternalServerErrorException(
        'Could not retrieve menus with selection state.',
      );
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    try {
      const cacheKey = `menus:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedMenus = await this.cacheManager.getCache<{
        data: Menu[];
        total: number;
      }>(cacheKey);
      if (cachedMenus) return cachedMenus;

      const queryBuilder = this.menuRepository
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.parent', 'parent')
        .where('menu.deletedAt IS NULL');

      if (filter) {
        queryBuilder.andWhere(`
          (menu.nameView ILIKE :filter OR
           menu.description ILIKE :filter OR
           parent.description ILIKE :filter)`,
          { filter: `%${filter}%` }
        );        
      }

      queryBuilder.orderBy('menu.orderItem', 'ASC');

      
      queryBuilder.skip(skip).take(take);

      const [menus, total] = await queryBuilder.getManyAndCount();

      const data = menus.map((menu) => ({
        ...menu,
        father: menu.parent ? menu.parent.description : '',
      }));

      const result = { data, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Could not retrieve the list of menus.',
      );
    }
  }

  async findOne(id: string): Promise<Menu> {
    try {
      const cacheKey = `menu:${id}`;
      let menu = await this.cacheManager.getCache<Menu>(cacheKey);
      if (!menu) {
        menu = await this.menuRepository.findOne({
          where: { id },
        });
        if (!menu) {
          throw new NotFoundException(`Menu with ID '${id}' not found.`);
        }
        await this.cacheManager.setCache(cacheKey, menu, CACHE_TTL);
      }
      return menu;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Could not retrieve the menu.');
    }
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    try {
      const existingMenu = await this.menuRepository.preload({
        id,
        ...updateMenuDto,
      });
      if (!existingMenu) {
        throw new NotFoundException(`Menu with ID '${id}' not found.`);
      }

      const updatedMenu = await this.menuRepository.save(existingMenu);
      await this.cacheManager.delCache(`menu:${id}`);
      await this.cacheManager.delCache('menus:*');
      return updatedMenu;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException('Could not update the menu.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existingMenu = await this.menuRepository.findOne({ where: { id } });
      if (!existingMenu) {
        throw new NotFoundException(`Menu with ID '${id}' not found.`);
      }
      await this.menuRepository.softDelete(id);
      await this.cacheManager.delCache(`menu:${id}`);
      await this.cacheManager.delCache('menus:*');
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException('Could not delete the menu.');
    }
  }
}
