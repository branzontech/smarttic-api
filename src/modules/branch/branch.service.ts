import { Injectable, NotFoundException } from '@nestjs/common';
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
        const branch = this.branchRepository.create(createBranchDto);
        const savedBranch = await this.branchRepository.save(branch);
        await this.cacheManager.delCache(`branches:*`);
        return savedBranch;
      } catch (error) {
        console.error('Error creating branch log:', error.message);
        throw error;
      }
    }
  
    async findAll(skip: number = 0, take: number = 10) {
      const cacheKey = `branches:skip:${skip}:take:${take}`;
  
      const cachedData = await this.cacheManager.getCache<{
        data: any[];
        total: number;
      }>(cacheKey);
      if (cachedData) return cachedData;
  
      const [branches, total] = await this.branchRepository.findAndCount({
        where: { deletedAt: null },
        skip,
        take,
      });
  
      const result = {
        data: { branches, total },
        message: 'Branch List',
      };
  
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    }
  
    async findById(id: string) {
      const cacheKey = `branch:${id}`;
  
      const cachedBranch = await this.cacheManager.getCache<any>(cacheKey);
      if (cachedBranch) return cachedBranch;
  
      const branch = await this.branchRepository.findOne({
        where: { id, deletedAt: null }
      });
  
      if (!branch) {
        throw new NotFoundException(`Branch with id ${id} not found`);
      }
  
      await this.cacheManager.setCache(cacheKey, branch, CACHE_TTL);
  
      return branch;
    }
  
    async update(id: string, branch: UpdateBranchDto) {
      try {
        const existingBranch = await this.branchRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingBranch) {
          throw new NotFoundException(`Branch with id ${id} not found`);
        }
  
        const updatedBranch = await this.branchRepository.save({
          ...existingBranch,
          ...branch,
        });
  
        await this.cacheManager.delCache(`branch:${id}`);
  
        return updatedBranch;
      } catch (error) {
        throw new NotFoundException(`Branch with id ${id} not found`);
      }
    }
  
    async remove(id: string) {
      try {
        const existingBranch = await this.branchRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingBranch) {
          throw new NotFoundException(`Branch with id ${id} not found`);
        }
  
        existingBranch.deletedAt = new Date();
        const deletedBranch = await this.branchRepository.save(existingBranch);
  
        await this.cacheManager.delCache(`branch:${id}`);
  
        return deletedBranch;
      } catch (error) {
        throw new NotFoundException(`Branch with id ${id} not found`);
      }
    }
}
