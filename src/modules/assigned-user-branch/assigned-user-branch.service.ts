import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedUserBranch } from 'src/modules/assigned-user-branch/entities/assigned-user-branch.entity';
import { CreateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/create-assigned-user-branch.dto';
import { UpdateAssignedUserBranchDto } from 'src/modules/assigned-user-branch/dto/update-assigned-user-branch.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class AssignedUserBranchService {
  constructor(
    @InjectRepository(AssignedUserBranch)
    private readonly assignedUserBranchRepository: Repository<AssignedUserBranch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  // Crear una asignación de usuario a sucursal
  async create(assignedUserBranchDto: CreateAssignedUserBranchDto) {
    try {
      const { userId, branchId } = assignedUserBranchDto;

      // Verificar si el usuario existe
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null },
        relations: ['role'], // Incluir la relación con Role
      });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      // Verificar si la sucursal existe
      const branch = await this.branchRepository.findOne({
        where: { id: branchId, deletedAt: null },
      });
      if (!branch) {
        throw new NotFoundException(`Branch with id ${branchId} not found`);
      }

      // Validar el rol del usuario
      this.validateUserRole(user.role);

      // Verificar si la asignación ya existe
      const exist = await this.assignedUserBranchRepository.findOne({
        where: { userId, branchId, deletedAt: null },
      });
      if (exist) {
        throw new BadRequestException(
          `User with id ${userId} is already assigned to branch with id ${branchId}`,
        );
      }

      // Crear la asignación
      const newAssignedUserBranch = this.assignedUserBranchRepository.create({
        userId,
        branchId,
      });
      const savedAssignedUserBranch =
        await this.assignedUserBranchRepository.save(newAssignedUserBranch);

      // Limpiar la caché
      await this.cacheManager.delCache(`assignedUserBranches:*`);

      return savedAssignedUserBranch;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Error creating assigned user branch. Ensure the data is valid.',
      );
    }
  }

  // Obtener todas las asignaciones
  async findAll(skip: number = 0, take: number = 10) {
    const cacheKey = `assignedUserBranches:skip:${skip}:take:${take}`;

    // Verificar si los datos están en caché
    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    // Obtener las asignaciones de la base de datos
    const [assignedUserBranches, total] =
      await this.assignedUserBranchRepository.findAndCount({
        where: { deletedAt: null },
        relations: ['user', 'branch'], // Incluir las relaciones con User y Branch
        skip,
        take,
      });

    const result = {
      data: { assignedUserBranches, total },
      message: 'Assigned User Branches List',
    };

    // Almacenar en caché
    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  // Obtener una asignación por ID
  async findById(id: string) {
    const cacheKey = `assignedUserBranch:${id}`;

    // Verificar si la asignación está en caché
    const cachedAssignedUserBranch =
      await this.cacheManager.getCache<any>(cacheKey);
    if (cachedAssignedUserBranch) return cachedAssignedUserBranch;

    // Obtener la asignación de la base de datos
    const assignedUserBranch = await this.assignedUserBranchRepository.findOne({
      where: { id },
      relations: ['user', 'branch'], // Incluir las relaciones con User y Branch
    });

    if (!assignedUserBranch) {
      throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
    }

    // Almacenar en caché
    await this.cacheManager.setCache(cacheKey, assignedUserBranch, CACHE_TTL);

    return assignedUserBranch;
  }

  // Actualizar una asignación
  async update(id: string, assignedUserBranchDto: UpdateAssignedUserBranchDto) {
    try {
      const existingAssignedUserBranch =
        await this.assignedUserBranchRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingAssignedUserBranch) {
        throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
      }

      // Validar el rol del usuario si se actualiza el userId
      if (assignedUserBranchDto.userId) {
        const user = await this.userRepository.findOne({
          where: { id: assignedUserBranchDto.userId },
          relations: ['role'], // Incluir la relación con Role
        });
        if (!user) {
          throw new NotFoundException(
            `User with id ${assignedUserBranchDto.userId} not found`,
          );
        }
        this.validateUserRole(user.role);
      }

      // Actualizar la asignación
      const updatedAssignedUserBranch = await this.assignedUserBranchRepository.save(
        {
          ...existingAssignedUserBranch,
          ...assignedUserBranchDto,
        },
      );

      // Limpiar la caché
      await this.cacheManager.delCache(`assignedUserBranch:${id}`);

      return updatedAssignedUserBranch;
    } catch (error) {
      throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
    }
  }

  // Eliminar una asignación (soft delete)
  async remove(id: string) {
    try {
      const existingAssignedUserBranch =
        await this.assignedUserBranchRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingAssignedUserBranch) {
        throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
      }

      // Soft delete
      existingAssignedUserBranch.deletedAt = new Date();
      const deletedAssignedUserBranch =
        await this.assignedUserBranchRepository.save(existingAssignedUserBranch);

      // Limpiar la caché
      await this.cacheManager.delCache(`assignedUserBranch:${id}`);

      return deletedAssignedUserBranch;
    } catch (error) {
      throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
    }
  }

  
  private validateUserRole(role: Role) {
    if (!role.isAgent && !role.isAdmin && !role.isConfigurator) {
      throw new BadRequestException(
        'The user does not have a valid role for this operation.',
      );
    }

    // Aquí puedes agregar más validaciones específicas según los roles
    if (role.isAdmin) {
      throw new BadRequestException(
        'Admin users cannot be assigned to branches.',
      );
    }

    if (role.isConfigurator) {
      throw new BadRequestException(
        'Configurator users cannot be assigned to branches.',
      );
    }

    // Solo los usuarios con isAgent pueden ser asignados a sucursales
    if (!role.isAgent) {
      throw new BadRequestException(
        'Only users with the agent role can be assigned to branches.',
      );
    }
  }
}