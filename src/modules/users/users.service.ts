import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
import { AssignedUserTicket } from '../assigned-user-ticket/entities/assigned-user-ticket.entity';
import { TicketStateService } from '../ticket-state/ticket-state.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(AssignedUserTicket)
    private readonly assignedUserTicketRepository: Repository<AssignedUserTicket>,
    private readonly branchService: BranchService,
    private readonly cacheManager: CacheManagerService,
    private readonly ticketStateService: TicketStateService,
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
        limite_ticket,
      } = user;

      // Verificar existencia de nombre de usuario y email (incluyendo eliminados)
      const [existUsername, existEmail, roleExists] = await Promise.all([
        this.userRepository.findOne({ where: { username } }),
        this.userRepository.findOne({ where: { email } }),
        this.roleRepository.findOne({ where: { id: roleId } }),
      ]);

      if (existUsername)
        throw new BadRequestException(
          `El usuario con nombre de usuario ${username} ya existe`,
        );
      if (existEmail)
        throw new BadRequestException(
          `El usuario con el email ${email} El usuario cone`,
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
        limite_ticket: limite_ticket,
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

  async findAll(skip: number, take: number, filter?: string) {
    try {
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
        .leftJoinAndSelect('assignedBranches.branch', 'branches');

      // Filtro (se mantiene igual)
      if (filter) {
        queryBuilder.andWhere(
          `
          "user"."name" ILIKE :filter OR 
          "user"."lastname" ILIKE :filter OR 
          "user"."email" ILIKE :filter OR 
          "role"."name" ILIKE :filter OR 
          "identificationType"."description" ILIKE :filter OR
          "branch"."name" ILIKE :filter OR
          "company"."name" ILIKE :filter
          `,
          { filter: `%${filter}%` },
        );
      }

      // Paginado después de filtrar
      queryBuilder.orderBy('user.createdAt', 'DESC').skip(skip).take(take);

      const [users, total] = await queryBuilder.getManyAndCount();

      const result = { data: users, total, message: 'User List' };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(error);
    }
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
        state: true,
        name: '',
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
      relations: ['role', 'company', 'assignedBranches'],
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    delete (user as User).password;
    (user as any).branches = user.assignedBranches.map(
      (branch) => branch.branchId,
    );
    delete (user as any).assignedBranches;

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return user;
  }

  async findCompanyById(id: string): Promise<User> {
    const cacheKey = `userCompany:${id}`;
    const cachedUser = await this.cacheManager.getCache<User>(cacheKey);
    if (cachedUser) return cachedUser;

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    delete (user as User).password;
    (user as any).branches = user.assignedBranches.map(
      (branch) => branch.branchId,
    );

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return user;
  }

  async findDefaultAgents(branchId?: string): Promise<User[]> {
    return this.userRepository.find({
      where: [
        {
          branchId: branchId,
          isAgentDefault: true,
          state: true,
          role: { isAgent: true },
        },
        {
          branchId: IsNull(),
          isAgentDefault: true,
          state: true,
          role: { isAgent: true },
        },
      ],
      relations: ['role'],
    });
  }

  async findAllAgent(branchId?: string): Promise<{ data: User[] }> {
    const cacheKey = `user:AllAgent`;
    const cachedUser = await this.cacheManager.getCache<{ data: User[] }>(
      cacheKey,
    );
    if (cachedUser) return cachedUser;

    const where = branchId
      ? [
          {
            state: true,
            branchId: branchId,
            role: { isAgent: true },
          },
          {
            state: true,
            branchId: IsNull(),
            role: { isAgent: true },
          },
        ]
      : {
          state: true,
          role: { isAgent: true },
        };

    const user = await this.userRepository.find({
      where,
      relations: ['role'],
    });

    if (!user) throw new NotFoundException(`Agentes no encontrados`);

    // await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    // return { data: user };
    // Search id of ticketstates "Abierto"

    const lastState = await this.ticketStateService.findLastTicketState();

    if (!lastState)
      throw new NotFoundException(
        `Hubo un error al obtener los agentes. Detalle: Estado de ticket`,
      );

    const resultWithTickets = await Promise.all(
      user.map(async (agent) => {
        const activeTicketsCount =
          await this.assignedUserTicketRepository.count({
            where: {
              user: { id: agent.id },
              state: true,
              ticket: {
                ticketState: { id: Not(lastState.id) },
                state: true,
              },
            },

            relations: ['ticket', 'ticket.ticketState'],
          });

        return {
          ...agent,
          activeTickets: activeTicketsCount,
        };
      }),
    );

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);

    return { data: resultWithTickets };
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

  async changePassword(
    id: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(
        'Las contraseñas no coinciden. Por favor, asegúrate de que ambas contraseñas sean iguales.',
      );
    }

    const hashedPassword = await hash(newPassword, 10);
    const updatedUser = await this.userRepository.save({
      ...existingUser,
      password: hashedPassword,
    });

    await this.cacheManager.delCache(`user:${id}`);
    await this.cacheManager.delCache('users:*');

    return updatedUser;
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { id },
      });
      if (!existingUser)
        throw new NotFoundException(`User with id ${id} not found`);

      const { password, branchId, branches = [], ...restUserData } = user;

      // Validación mutuamente excluyente
      if (branchId && branches.length > 0) {
        throw new BadRequestException(
          'Cannot specify both branchId and branches[]',
        );
      }

      // Validar nuevas branches si se pasan
      const branchIdsToCheck = branchId ? [branchId] : branches;
      const uniqueBranchIds = [...new Set(branchIdsToCheck)];

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

      // Filtrar campos no nulos (como hicimos antes)
      const filteredUser = Object.fromEntries(
        Object.entries(restUserData).filter(
          ([_, value]) => value !== null && value !== undefined,
        ),
      );

      if (password) {
        filteredUser.password = await hash(password, 10);
      }

      // Actualizar datos del usuario
      const updatedUser = await queryRunner.manager.save(User, {
        ...existingUser,
        ...filteredUser,
        branchId: branches.length > 0 ? null : branchId,
      });

      // Actualizar relaciones con branches
      if (branches.length > 0) {
        // Eliminar las relaciones existentes
        await queryRunner.manager.delete(AssignedUserBranch, { userId: id });

        // Crear nuevas relaciones
        for (const bId of branches) {
          await queryRunner.manager.save(AssignedUserBranch, {
            userId: id,
            branchId: bId,
          });
        }
      }

      await queryRunner.commitTransaction();

      await this.cacheManager.delCache(`user:${id}`);
      await this.cacheManager.delCache('users:*');

      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error updating user: ' + error.message);
    } finally {
      await queryRunner.release();
    }
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
