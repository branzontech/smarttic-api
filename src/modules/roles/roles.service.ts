import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from 'src/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from 'src/modules/roles/dto/update-role.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { Role } from 'src/modules/roles/entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name, deletedAt: null },
      });
  
      if (existingRole) {
        throw new Error(`El rol '${createRoleDto.name}' ya existe.`);
      }
      const role = this.roleRepository.create(createRoleDto);
      const savedRole = await this.roleRepository.save(role);
      await this.cacheManager.delCache(`roles:*`);
      return savedRole;
    } catch (error) {
      console.error('Error creating role log:', error.message);
      throw error;
    }
  }

  async findAll(skip: number = 0, take: number = 10) {
    const cacheKey = `roles:skip:${skip}:take:${take}`;

    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const [roles, total] = await this.roleRepository.findAndCount({
      where: { deletedAt: null },
      skip,
      take,
    });

    const result = {
      data: { roles, total },
      message: 'Role List',
    };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findById(id: string) {
    const cacheKey = `role:${id}`;

    const cachedRole = await this.cacheManager.getCache<any>(cacheKey);
    if (cachedRole) return cachedRole;

    const role = await this.roleRepository.findOne({
      where: { id, deletedAt: null }
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    await this.cacheManager.setCache(cacheKey, role, CACHE_TTL);

    return role;
  }

  async update(id: string, role: UpdateRoleDto) {
    try {
      const existingRole = await this.roleRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingRole) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      const updatedRole = await this.roleRepository.save({
        ...existingRole,
        ...role,
      });

      await this.cacheManager.delCache(`role:${id}`);

      return updatedRole;
    } catch (error) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const existingRole = await this.roleRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingRole) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      existingRole.deletedAt = new Date();
      const deletedRole = await this.roleRepository.save(existingRole);

      await this.cacheManager.delCache(`role:${id}`);

      return deletedRole;
    } catch (error) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
  }
}
