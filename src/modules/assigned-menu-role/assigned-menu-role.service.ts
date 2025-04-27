import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedMenuRole } from 'src/modules/assigned-menu-role/entities/assigned-menu-role.entity';
import { CreateAssignedMenuRoleDto } from 'src/modules/assigned-menu-role/dto/create-assigned-menu-role.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';

@Injectable()
export class AssignedMenuRoleService {
  constructor(
    @InjectRepository(AssignedMenuRole)
    private readonly assignedMenuRoleRepository: Repository<AssignedMenuRole>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async assignAccessLevel(roleId: string, dataMenu: string[]): Promise<{ success: boolean; data?: string[]; message: string }> {
    if (!roleId || !Array.isArray(dataMenu) || dataMenu.length === 0) {
      throw new BadRequestException('roleId and dataMenu are required.');
    }

    try {
      await this.assignedMenuRoleRepository.manager.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.delete(AssignedMenuRole, { roleId });

        const newAssignments = dataMenu.map(menuId => {
          const dto = new CreateAssignedMenuRoleDto();
          dto.menuId = menuId;
          dto.roleId = roleId;

          if (!dto.menuId || !dto.roleId) {
            throw new BadRequestException('menuId and roleId are required.');
          }

          return this.assignedMenuRoleRepository.create(dto);
        });
        await this.cacheManager.delCache('menus:*');
        await transactionalEntityManager.save(AssignedMenuRole, newAssignments);
      });

      return { success: true, data: dataMenu, message: 'Assignment successful.' };
    } catch (error) {
      console.error('Error in assignAccessLevel:', error);
      throw new InternalServerErrorException('Error assigning permissions.');
    }
  }
}
