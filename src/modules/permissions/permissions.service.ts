import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from 'src/modules/permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from 'src/modules/permissions/dto/update-permission.dto';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      const permission = this.permissionRepository.create(createPermissionDto);
      const savedPermission = await this.permissionRepository.save(permission);
      await this.cacheManager.delCache(`permissions:*`);
      return savedPermission;
    } catch (error) {
      console.error('Error creating permission log:', error.message);
      throw error;
    }
  }

  async findAll(skip: number = 0, take: number = 10) {
    const cacheKey = `permissions:skip:${skip}:take:${take}`;

    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const [permissions, total] = await this.permissionRepository.findAndCount({
      where: { deletedAt: null },
      skip,
      take,
    });

    const result = {
      data: { permissions, total },
      message: 'Permission List',
    };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findById(id: string) {
      const cacheKey = `permission:${id}`;
  
      const cachedPermission = await this.cacheManager.getCache<any>(cacheKey);
      if (cachedPermission) return cachedPermission;
  
      const permission = await this.permissionRepository.findOne({
        where: { id, deletedAt: null }
      });
  
      if (!permission) {
        throw new NotFoundException(`Permission with id ${id} not found`);
      }
  
      await this.cacheManager.setCache(cacheKey, permission, CACHE_TTL);
  
      return permission;
    }
  
    async update(id: string, permission: UpdatePermissionDto) {
      try {
        const existingPermission = await this.permissionRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingPermission) {
          throw new NotFoundException(`Permission with id ${id} not found`);
        }
  
        const updatedPermission = await this.permissionRepository.save({
          ...existingPermission,
          ...permission,
        });
  
        await this.cacheManager.delCache(`permission:${id}`);
  
        return updatedPermission;
      } catch (error) {
        throw new NotFoundException(`Permission with id ${id} not found`);
      }
    }
  
    async remove(id: string) {
      try {
        const existingPermission = await this.permissionRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingPermission) {
          throw new NotFoundException(`Permission with id ${id} not found`);
        }
  
        existingPermission.deletedAt = new Date();
        const deletedPermission = await this.permissionRepository.save(existingPermission);
  
        await this.cacheManager.delCache(`permission:${id}`);
  
        return deletedPermission;
      } catch (error) {
        throw new NotFoundException(`Permission with id ${id} not found`);
      }
    }
}
