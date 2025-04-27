import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
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

  async create(dto: CreateAssignedUserBranchDto) {
    try {
      const { userId, branchId } = dto;
      const user = await this.getUserById(userId);
      const branch = await this.getBranchById(branchId);

      this.validateUserRole(user.role);
      await this.ensureAssignmentDoesNotExist(userId, branchId);

      const assignedUserBranch = this.assignedUserBranchRepository.create({ userId, branchId });
      const savedAssignedUserBranch = await this.assignedUserBranchRepository.save(assignedUserBranch);

      await this.cacheManager.delCache('assignedUserBranches:*');
      return savedAssignedUserBranch;
    } catch (error) {
      throw new InternalServerErrorException(`Error creating AssignedUserBranch: ${error.message}`);
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `assignedUserBranches:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache(cacheKey);
      if (cachedData) return cachedData;

      const [assignedUserBranches, total] = await this.assignedUserBranchRepository.findAndCount({
        relations: ['user', 'branch'],
        skip,
        take,
      });

      const result = { data: assignedUserBranches, total , message: 'Assigned User Branches List' };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching AssignedUserBranches: ${error.message}`);
    }
  }

  async findById(id: string): Promise<AssignedUserBranch> {
    try {
      const cacheKey = `assignedUserBranch:${id}`;
      const cachedAssignedUserBranch = await this.cacheManager.getCache<AssignedUserBranch>(cacheKey);
      if (cachedAssignedUserBranch) return cachedAssignedUserBranch;

      const assignedUserBranch = await this.getAssignedUserBranchById(id);
      await this.cacheManager.setCache(cacheKey, assignedUserBranch, CACHE_TTL);
      return assignedUserBranch;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching AssignedUserBranch with id ${id}: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateAssignedUserBranchDto): Promise<AssignedUserBranch> {
    try {
      const existingAssignedUserBranch = await this.getAssignedUserBranchById(id);
      if (dto.userId) this.validateUserRole((await this.getUserById(dto.userId)).role);

      const updatedAssignedUserBranch = await this.assignedUserBranchRepository.save({
        ...existingAssignedUserBranch,
        ...dto,
      });

      await this.cacheManager.delCache(`assignedUserBranch:${id}`);
      await this.cacheManager.delCache(`assignedUserBranches:*`);
      return updatedAssignedUserBranch;
    } catch (error) {
      throw new InternalServerErrorException(`Error updating AssignedUserBranch with id ${id}: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const assignedUserBranch = await this.getAssignedUserBranchById(id);
      await this.assignedUserBranchRepository.softDelete(id);
      
      await this.cacheManager.delCache(`assignedUserBranch:${id}`);
      await this.cacheManager.delCache(`assignedUserBranches:*`);
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting AssignedUserBranch with id ${id}: ${error.message}`);
    }
  }

  private async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  private async getBranchById(branchId: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!branch) throw new NotFoundException(`Branch with id ${branchId} not found`);
    return branch;
  }

  private async getAssignedUserBranchById(id: string): Promise<AssignedUserBranch> {
    const assignedUserBranch = await this.assignedUserBranchRepository.findOne({ where: { id } });
    if (!assignedUserBranch) throw new NotFoundException(`AssignedUserBranch with id ${id} not found`);
    return assignedUserBranch;
  }

  private async ensureAssignmentDoesNotExist(userId: string, branchId: string) {
    const exist = await this.assignedUserBranchRepository.findOne({ where: { userId, branchId } });
    if (exist) throw new BadRequestException(`User with id ${userId} is already assigned to branch with id ${branchId}`);
  }

  private validateUserRole(role: Role) {
    if (!role.isAgent && !role.isAdmin && !role.isConfigurator) 
      throw new BadRequestException('The regular user does not have a valid role for this operation.');
    
    if (role.isConfigurator) throw new BadRequestException('Configurator users cannot be assigned to branches.');
  }
}
