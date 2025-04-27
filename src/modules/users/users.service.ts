import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { hash } from 'bcrypt';
import { BranchService } from '../branch/branch.service';
import { AssignedUserBranch } from '../assigned-user-branch/entities/assigned-user-branch.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly branchService: BranchService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(user: CreateUserDto): Promise<User> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      const {
        username,
        password,
        email,
        roleId,
        branches = [],
        branchId,
      } = user;

      // Verificar existencia de nombre de usuario y email (incluyendo eliminados)
      const [existUsername, existEmail, roleExists] = await Promise.all([
        this.userRepository.findOne({ where: { username }, withDeleted: true }),
        this.userRepository.findOne({ where: { email }, withDeleted: true }),
        this.roleRepository.findOne({ where: { id: roleId } }),
      ]);

      if (existUsername)
        throw new BadRequestException(
          `User with username ${username} already exists`,
        );
      if (existEmail)
        throw new BadRequestException(
          `User with email ${email} already exists`,
        );
      if (!roleExists)
        throw new NotFoundException(`Role with id ${roleId} not found`);

      // Validación mutuamente excluyente
      if (branchId && branches.length > 0) {
        throw new BadRequestException(
          'Cannot specify both branchId and branches[]',
        );
      }

      // Validación de branches
      const branchIdsToCheck = branchId ? [branchId] : branches;
      const uniqueBranchIds = [...new Set(branchIdsToCheck)]; // Eliminar duplicados

      if (uniqueBranchIds.length > 0) {
        const branchesExist = await Promise.all(
          uniqueBranchIds.map((id) => this.branchService.findById(id)),
        );

        const invalidBranches = uniqueBranchIds.filter(
          (_, index) => !branchesExist[index],
        );
        if (invalidBranches.length > 0) {
          throw new BadRequestException(
            `Invalid branch IDs: ${invalidBranches.join(', ')}`,
          );
        }
      }

      // Crear usuario
      const hashedPassword = await hash(password, 10);
      const { branches: _, ...userData } = user;
      const newUser = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        branchId: branches.length > 0 ? null : branchId, // Asegurar null si usa branches
      });

      const savedUser = await queryRunner.manager.save(newUser);

      // Asignar branches usando el mismo queryRunner
      if (branches.length > 0) {
        await Promise.all(
          branches.map((branchId) =>
            queryRunner.manager.save(AssignedUserBranch, {
              userId: savedUser.id,
              branchId,
            }),
          ),
        );
      }

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error creating user: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(skip = 0, take = 10, filter?: string) {
    const cacheKey = `users:skip:${skip}:take:${take}:filter:${filter || ''}`;
    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.role', 'role')
    .leftJoinAndSelect('user.identificationType', 'identificationType')
    .leftJoinAndSelect('user.branch', 'branch')
    .leftJoinAndSelect('user.company', 'company')
    .leftJoinAndSelect('user.assignedBranches', 'assignedBranches')
    .leftJoinAndSelect('assignedBranches.branch', 'branches')

  // Filtro (se mantiene igual)
  if (filter) {
    queryBuilder.andWhere(
      `
      user.name ILIKE :filter OR 
      user.lastName ILIKE :filter OR 
      user.email ILIKE :filter OR 
      role.description ILIKE :filter OR 
      identificationType.description ILIKE :filter OR
      branch.name ILIKE :filter OR
      company.name ILIKE :filter
      `,
      { filter: `%${filter}%` },
    );
  }


    // Paginado después de filtrar
    queryBuilder.skip(skip).take(take);

    const [users, total] = await queryBuilder.getManyAndCount();

    const result = { data: users, total, message: 'User List' };
    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findAllWithCompanyName(): Promise<{ data: Partial<User>[] }> {
    const cacheKey = 'users:withCompanyName';
    const cachedUsers = await this.cacheManager.getCache<{
      data: Partial<User>[];
    }>(cacheKey);
    if (cachedUsers) return cachedUsers;

    const users = await this.userRepository.find({
      select: ['id', 'companyname'],
      where: {
        companyname: Not(IsNull()),
      },
    });

    await this.cacheManager.setCache(cacheKey, users, CACHE_TTL);
    return { data: users };
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.getCache<User>(cacheKey);
    if (cachedUser) return cachedUser;

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'company'],
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return user;
  }

  async findDefaultAgent(branchId?:string): Promise<User> {
    const cacheKey = `user:DefaultAgent`;
    const cachedUser = await this.cacheManager.getCache<User>(cacheKey);
    if (cachedUser) return cachedUser;

    const user = await this.userRepository.findOne({
      where: {
        isAgentDefault: true,
        state: true,
        branchId: branchId ? branchId : Not(IsNull()),
        role: {
          isAgent: true,
        },
      },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`Default Agent not found`);

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return user;
  }

  async findAllAgent(branchId?:string): Promise<{data:User[]}> {
    const cacheKey = `user:AllAgent`;
    const cachedUser = await this.cacheManager.getCache<{data:User[]}>(cacheKey);
    if (cachedUser) return cachedUser;

    const user = await this.userRepository.find({
      where: {
        state: true,
        branchId: branchId ? branchId : Not(IsNull()),
        role: {
          isAgent: true,
        },
      },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`Default Agents not found`);

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return {data:user};
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user)
      throw new NotFoundException(`User with username ${username} not found`);
    return user;
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { id } });
    if (!existingUser)
      throw new NotFoundException(`User with id ${id} not found`);

    const updatedUser = await this.userRepository.save({
      ...existingUser,
      ...user,
    });
    await this.cacheManager.delCache(`user:${id}`);
    await this.cacheManager.delCache('users:*');
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({ where: { id } });
    if (!existingUser)
      throw new NotFoundException(`User with id ${id} not found`);

    await this.userRepository.softDelete(id);
    await this.cacheManager.delCache(`user:${id}`);
    await this.cacheManager.delCache('users:*');
  }
}
