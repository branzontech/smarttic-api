import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
      await this.cacheManager.delCache('permissions:*');
      return savedPermission;
    } catch (error) {
      console.error('Error creating permission:', error.message);
      throw new InternalServerErrorException('Failed to create permission');
    }
  }

  async findAll(skip:number = 0, take:number = 10, filter?: string) {
    const cacheKey = `permissions:skip:${skip}:take:${take}:filter:${filter || ''}`;
    const cachedData = await this.cacheManager.getCache<{ data: Permission[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;

    const [permissions, total] = await this.permissionRepository.findAndCount({
      skip,
      take,
    });

    const result = { data: permissions, total, message: 'Permission List' };
    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<Permission> {
    const cacheKey = `permission:${id}`;
    const cachedPermission = await this.cacheManager.getCache<Permission>(cacheKey);
    if (cachedPermission) return cachedPermission;

    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found`);
    }

    await this.cacheManager.setCache(cacheKey, permission, CACHE_TTL);
    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionRepository.preload({ id, ...updatePermissionDto });
    if (!existingPermission || existingPermission.deletedAt) {
      throw new NotFoundException(`Permission with id ${id} not found`);
    }

    const updatedPermission = await this.permissionRepository.save(existingPermission);
    await this.cacheManager.delCache(`permission:${id}`);
    await this.cacheManager.delCache('permissions:*');
    return updatedPermission;
  }

  async remove(id: string): Promise<void> {
    const existingPermission = await this.permissionRepository.findOne({ where: { id } });
    if (!existingPermission) {
      throw new NotFoundException(`Permission with id ${id} not found`);
    }

    await this.permissionRepository.softDelete(id);
    await this.cacheManager.delCache(`permission:${id}`);
    await this.cacheManager.delCache('permissions:*');
  }
}
