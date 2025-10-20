import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
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
import { columnDataFilter } from 'src/common/types';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

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
    const imagePath = user.profileImageName
    ? join(__dirname, '../../../', user.profileImageName)
    : null;
    try {
      await queryRunner.startTransaction();

      const {
        username,
        password,
        email,
        numberIdentification,
        roleId,
        branches = [],
        branchId,
        limite_ticket,
      } = user;

      // Verificar existencia de nombre de usuario y email (incluyendo eliminados)
      const [existNumberIdentification, existEmail, roleExists] = await Promise.all([
        this.userRepository.findOne({ where: { numberIdentification } }),
        this.userRepository.findOne({ where: { email } }),
        this.roleRepository.findOne({ where: { id: roleId } }),
      ]);

      if (existNumberIdentification)
        throw new BadRequestException(
          `El usuario con numero de identificacion ${existNumberIdentification} ya existe`,
        );
      if (existEmail)
        throw new BadRequestException(
          `El usuario con el email ${email} ya existe`,
        );
      if (!roleExists)
        throw new NotFoundException(`No se encontró el rol con id ${roleId}`);

      if (!roleExists.isAgent && user.limite_ticket && user.limite_ticket > 0)
        throw new NotFoundException(
          `Este usuario no puede tener un límite de tickets si no es un agente.`,
        );

      if (branchId && branches.length > 0) {
        throw new BadRequestException(
          'No se pueden especificar tanto branchId como ramas[]',
        );
      }

      // Validación de branches
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
            `ID de sucursal no válidos: ${invalidBranches.join(', ')}`,
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
        branchId: branches.length > 0 ? null : branchId,
      });

      const savedUser = await queryRunner.manager.save(newUser);

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
       if (imagePath && existsSync(imagePath)) {
        try {
          unlinkSync(imagePath);
          console.log('Imagen eliminada por error al crear usuario:', imagePath);
        } catch (e) {
          console.error('Error al eliminar la imagen:', e.message);
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error; // ya viene con mensaje
      }

      throw new InternalServerErrorException('Error al crear el usuario: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(skip: number, 
    take: number, 
    filter?: string,
    columnFilters?: columnDataFilter[]) {
    try {
      const filtersKey = columnFilters?.map((f) => `${f.id}:${f.value}`).join(',') || '';
      const cacheKey = `users:skip:${skip}:take:${take}:filter:${filter || ''}:columnFilters:${filtersKey}`;
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
          CONCAT(user.name, ' ', user.lastname) ILIKE :filter OR 
          "user"."email" ILIKE :filter OR 
          "role"."name" ILIKE :filter OR 
          "identificationType"."description" ILIKE :filter OR
          "branch"."name" ILIKE :filter OR
          "company"."name" ILIKE :filter
          `,
          { filter: `%${filter}%` },
        );
      }

      if (columnFilters?.length) {
        for (const { id, value } of columnFilters) {
          if (!value) continue;

          if (id === 'fullName') {
            queryBuilder.andWhere(
              `(CONCAT(user.name, ' ', user.lastname) ILIKE :userValue OR user.companyname ILIKE :userValue)`,
              { userValue: `%${value}%` },
            );
            continue;
          }

          if (id === 'assignedBranches.branch') {
            const branchNames = value.split(',')
              .map((v) => v.trim())
              .filter((v) => v.length > 0);

            if (branchNames.length) {
              const orConditions = branchNames.map((name, index) => {
                return `branches.name ILIKE :branchName${index}`;
              }).join(' OR ');

              const params = branchNames.reduce((acc, name, index) => {
                acc[`branchName${index}`] = `%${name}%`;
                return acc;
              }, {} as Record<string, string>);

              queryBuilder.andWhere(`(${orConditions})`, params);
            }
            continue;
          }

          // Convertir a alias y campo
          const [alias, field] = id.split('.');
          if (!alias || !field) continue;

          const paramName = `${alias}_${field}`;
          // Agrega el filtro ILIKE de forma dinámica
          queryBuilder.andWhere(`${alias}.${field} ILIKE :${paramName}`, {
            [paramName]: `%${value}%`,
          });
        }
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
    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);
    return user;
  }

  async findDefaultAgents(branchId?: string, manager?: EntityManager): Promise<User[]> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;

    const query = repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('user.assignedBranches', 'assignedUserBranch')
      .where('user.isAgentDefault = :isAgentDefault', { isAgentDefault: true })
      .andWhere('user.state = :state', { state: true })
      .andWhere('role.isAgent = :isAgent', { isAgent: true });

    if (branchId) {
      query.andWhere('assignedUserBranch.branchId = :branchId', { branchId });
    }

    return await query.getMany();
  }


  async findAllAgent(branchId?: string): Promise<{ data: User[] }> {
    const cacheKey = `user:AllAgent:${branchId || 'all'}`;
    const cachedUser = await this.cacheManager.getCache<{ data: User[] }>(cacheKey);
    if (cachedUser) return cachedUser;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.assignedBranches', 'assignedUserBranch')
      .where('user.state = :state', { state: true })
      .andWhere('user.isDesignatedApprover = :isDesignatedApprover', { isDesignatedApprover: false })
      .andWhere('role.isAgent = :isAgent', { isAgent: true });

    if (branchId) {
      query.andWhere('assignedUserBranch.branchId = :branchId', { branchId });
    }

    const users = await query.getMany();

    if (!users || users.length === 0) {
      throw new NotFoundException(`Agentes no encontrados`);
    }

    const lastState = await this.ticketStateService.findLastTicketState();
    if (!lastState) {
      throw new NotFoundException(`Hubo un error al obtener los agentes. Detalle: Estado de ticket`);
    }

    const resultWithTickets = await Promise.all(
      users.map(async (agent) => {
        const activeTicketsCount = await this.assignedUserTicketRepository.count({
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

    await this.cacheManager.setCache(cacheKey, { data: resultWithTickets }, CACHE_TTL);

    return { data: resultWithTickets };
  }


  async findDesignatedApproverAgent(branchId?: string, manager?: EntityManager): Promise<User> {
    try {
      const repo = manager ? manager.getRepository(User) : this.userRepository;
      const query = repo
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.role', 'role')
        .where('user.state = :state', { state: true })
        .andWhere('role.isAgent = true')
        .andWhere('user.isDesignatedApprover = true');

      if (branchId) {
        query.andWhere('(user.branchId = :branchId OR user.branchId IS NULL)', {
          branchId,
        });
      }

      // Prioriza los que tienen isAgentDefault = true
      query.orderBy('user.isAgentDefault', 'DESC');

      // Solo uno
      const agent = await query.getOne();

      if (!agent) {
        throw new NotFoundException(
          'No se encontró un agente aprobador designado.',
        );
      }

      return agent;
    } catch (error) {
      console.error('Error al obtener agente designado:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el agente designado.',
      );
    }
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
        throw new NotFoundException(`No se encontró el usuario con id ${id}`);

      const {
        username,
        email,
        password,
        branchId,
        branches = [],
        ...restUserData
      } = user;

      if (email) {
        const userWithEmail = await this.userRepository.findOne({
          where: { email },
        });
        if (userWithEmail && userWithEmail.id !== id) {
          throw new BadRequestException(
            'El correo electrónico ya está registrado por otro usuario.',
          );
        }
      }

      if (username) {
        const userWithUsername = await this.userRepository.findOne({
          where: { username },
        });
        if (userWithUsername && userWithUsername.id !== id) {
          throw new BadRequestException(
            'El nombre de usuario ya está registrado por otro usuario.',
          );
        }
      }

      if (branchId && branches.length > 0) {
        throw new BadRequestException(
          'No se pueden especificar tanto branchId como sucursales[]',
        );
      }

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
            `ID de sucursal no válidos: ${invalidBranches.join(', ')}`,
          );
        }
      }

      if (user.roleId) {
        const roleExists = await this.roleRepository.findOne({
          where: { id: user.roleId },
        });

        if (!roleExists) {
          throw new NotFoundException(
            `No se encontró el rol con id ${user.roleId}`,
          );
        }

        if (
          !roleExists.isAgent &&
          user.limite_ticket &&
          user.limite_ticket > 0
        ) {
          throw new BadRequestException(
            `Este usuario no puede tener un límite de tickets si no es un agente.`,
          );
        }
      }

      const filteredUser = Object.fromEntries(
        Object.entries(restUserData).filter(
          ([_, value]) => value !== null && value !== undefined,
        ),
      );

      if (email) {
        filteredUser.email = email;
      }

      if (password) {
        filteredUser.password = await hash(password, 10);
      }

      const updatedUser = await queryRunner.manager.save(User, {
        ...existingUser,
        ...filteredUser,
        branchId: branches.length > 0 ? null : branchId,
      });

      if (branches.length > 0) {
        await queryRunner.manager.delete(AssignedUserBranch, { userId: id });

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
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);

    await this.userRepository.softDelete(id);
    await this.cacheManager.delCache(`user:${id}`);
    await this.cacheManager.delCache('users:*');
  }
}
