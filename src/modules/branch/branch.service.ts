import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from 'src/modules/branch/dto/create-branch.dto';
import { UpdateBranchDto } from 'src/modules/branch/dto/update-branch.dto';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    try {
      const existingBranch = await this.branchRepository.findOne({
        where: { name: createBranchDto.name },
      });

      if (existingBranch) {
        throw new ConflictException(`Branch '${createBranchDto.name}' already exists.`);
      }

      const branch = this.branchRepository.create(createBranchDto);
      const savedBranch = await this.branchRepository.save(branch);

      await this.cacheManager.delCache(`branches:*`);
      return savedBranch;
    } catch (error) {
      console.error('Error in create:', error);
      throw new InternalServerErrorException('Could not create the branch.');
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `branches:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{ data: Branch[]; total: number }>(cacheKey);
  
      if (cachedData) return cachedData;
  
      const queryBuilder = this.branchRepository.createQueryBuilder('branch');
  
      if (filter) {
        queryBuilder.andWhere(
          'branch.description ILIKE :filter OR branch.name ILIKE :filter',
          { filter: `%${filter}%` }
        );
      }
  
      queryBuilder.skip(skip).take(take);
  
      const [branches, total] = await queryBuilder.getManyAndCount();
  
      const result = { data: branches, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Could not retrieve the list of branches.');
    }
  }
  

  async findById(id: string): Promise<Branch> {
    try {
      const cacheKey = `branch:${id}`;
      let branch = await this.cacheManager.getCache<Branch>(cacheKey);

      if (!branch) {
        branch = await this.branchRepository.findOne({ where: { id } });
        if (!branch) {
          throw new NotFoundException(`Branch with ID '${id}' not found.`);
        }
        await this.cacheManager.setCache(cacheKey, branch, CACHE_TTL);
      }

      return branch;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new InternalServerErrorException('Could not retrieve the branch.');
    }
  }


  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    try {
      const existingBranch = await this.branchRepository.preload({ id, ...updateBranchDto });

      if (!existingBranch) {
        throw new NotFoundException(`Branch with ID '${id}' not found.`);
      }

      const updatedBranch = await this.branchRepository.save(existingBranch);
      await this.cacheManager.delCache(`branch:${id}`);
      await this.cacheManager.delCache(`branches:*`);

      return updatedBranch;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException('Could not update the branch.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existingBranch = await this.branchRepository.findOne({ where: { id } });

      if (!existingBranch) {
        throw new NotFoundException(`Branch with ID '${id}' not found.`);
      }

      await this.branchRepository.softDelete(id);
      await this.cacheManager.delCache(`branch:${id}`);
      await this.cacheManager.delCache(`branches:*`);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException('Could not delete the branch.');
    }
  }
}
