// src/modules/users/services/users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  // Crear un usuario
  async create(user: CreateUserDto) {
    try {
      const { username, password, email } = user;
      
      const existUsername = await this.userRepository.findOne({ where: { username } });
      if (existUsername) {
        throw new NotFoundException(`User with username ${username} already exists`);
      }
      
      const existEmail = await this.userRepository.findOne({ where: { email } });
      if (existEmail) {
        throw new NotFoundException(`User with email ${email} already exists`);
      }

      const roleExists = await this.roleRepository.findOne({
        where: { id: user.roleId },
      });
      if (!roleExists) {
        throw new NotFoundException(`Role with id ${user.roleId} not found`);
      }

     
      const hashedPassword = await hash(password, 10);
      user = { ...user, password: hashedPassword };

     
      const newUser = this.userRepository.create(user);
      const savedUser = await this.userRepository.save(newUser);

      
      await this.cacheManager.delCache(`users:*`);

      return savedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error creating user. Ensure the data is valid.',
      );
    }
  }

  async findAll(skip: number = 0, take: number = 10) {
    const cacheKey = `users:skip:${skip}:take:${take}`;

    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const [users, total] = await this.userRepository.findAndCount({
      where: { deletedAt: null },
      relations: ['role'], // Incluir la relación con Role
      skip,
      take,
    });

    const result = {
      data: { users, total },
      message: 'User List',
    };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  
  async findById(id: string) {
    const cacheKey = `user:${id}`;

    const cachedUser = await this.cacheManager.getCache<any>(cacheKey);
    if (cachedUser) return cachedUser;

    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['role'], // Incluir la relación con Role
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.cacheManager.setCache(cacheKey, user, CACHE_TTL);

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User with username ${username} not found`);

    return user;
  }

  // Actualizar un usuario
  async update(id: string, user: UpdateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const updatedUser = await this.userRepository.save({
        ...existingUser,
        ...user,
      });

      // Limpiar la caché
      await this.cacheManager.delCache(`user:${id}`);

      return updatedUser;
    } catch (error) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const existingUser = await this.userRepository.findOne({ where: { id, deletedAt: null } });
      if (!existingUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      existingUser.deletedAt = new Date();
      const deletedUser = await this.userRepository.save(existingUser);

      await this.cacheManager.delCache(`user:${id}`);

      return deletedUser;
    } catch (error) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}