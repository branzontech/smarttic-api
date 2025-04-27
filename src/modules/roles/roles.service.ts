import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
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
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(`El rol '${createRoleDto.name}' ya existe.`);
      }

      const role = this.roleRepository.create(createRoleDto);
      const savedRole = await this.roleRepository.save(role);

      await this.cacheManager.delCache(`roles:*`);
      return savedRole;
    } catch (error) {
      console.error('Error creating role log:', error.message);
      throw new InternalServerErrorException('Error al crear el rol');
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    const cacheKey = `roles:skip:${skip}:take:${take}:filter:${filter || ''}`;
  
    const cachedData = await this.cacheManager.getCache<{ data: any[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;
  
    const queryBuilder = this.roleRepository.createQueryBuilder('role');
  
    if (filter) {
      queryBuilder.andWhere('role.name ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }
  
    queryBuilder.skip(skip).take(take);
  
    const [roles, total] = await queryBuilder.getManyAndCount();
  
    const result = { data:roles, total };
  
    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
    return result;
  }
  

  async findAllAvailable() {
    const cacheKey = `roles:available`;

    const cachedData = await this.cacheManager.getCache<{ data: any[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;

    const roles = await this.roleRepository.find({
      select: {
        name: true
      }
      
    });

    

    await this.cacheManager.setCache(cacheKey, roles, CACHE_TTL);

    return roles;
  }

  async findById(id: string): Promise<Role> {
      try {
        const cacheKey = `role:${id}`;

        const cachedRole = await this.cacheManager.getCache<Role>(cacheKey);
        if (cachedRole) return cachedRole;
    
        const role = await this.roleRepository.findOne({ where: { id } });
    
        if (!role) {
          throw new NotFoundException(`Role with id ${id} not found`);
        }
    
        await this.cacheManager.setCache(cacheKey, role, CACHE_TTL);
        return role;
      } catch (error) {
        console.error('Error in findById:', error);
        throw new InternalServerErrorException('Could not retrieve the Role.');
      }
    }

  async update(id: string, roleDto: UpdateRoleDto): Promise<Role> {
    try {
      const existingRole = await this.roleRepository.findOne({ where: { id } });
      if (!existingRole) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      const updatedRole = await this.roleRepository.save({ ...existingRole, ...roleDto });

      await this.cacheManager.delCache(`role:${id}`);
      await this.cacheManager.delCache(`roles:*`);

      return updatedRole;
    } catch (error) {
      console.error('Error updating role log:', error.message);
      throw new InternalServerErrorException(`Error al actualizar el rol con id ${id}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existingRole = await this.roleRepository.findOne({ where: { id } });
      if (!existingRole) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      await this.roleRepository.softDelete(id);
      await this.cacheManager.delCache(`role:${id}`);
      await this.cacheManager.delCache(`roles:*`);
    } catch (error) {
      console.error('Error deleting role log:', error.message);
      throw new InternalServerErrorException(`Error al eliminar el rol con id ${id}`);
    }
  }
}
