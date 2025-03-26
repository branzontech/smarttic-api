import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIdentificationTypeDto } from 'src/modules/identification-type/dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from 'src/modules/identification-type/dto/update-identification-type.dto';
import { IdentificationType } from 'src/modules/identification-type/entities/identification-type.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class IdentificationTypeService {
  constructor(
      @InjectRepository(IdentificationType)
      private readonly identificationTypeRepository: Repository<IdentificationType>,
      private readonly cacheManager: CacheManagerService,
    ) {}
  
    async create(createIdentificationTypeDto: CreateIdentificationTypeDto): Promise<IdentificationType> {
      try {
        const identificationType = this.identificationTypeRepository.create(createIdentificationTypeDto);
        const savedIdentificationType = await this.identificationTypeRepository.save(identificationType);
        await this.cacheManager.delCache(`identificationTypes:*`);
        return savedIdentificationType;
      } catch (error) {
        console.error('Error creating identificationType log:', error.message);
        throw error;
      }
    }
  
    async findAll(skip: number = 0, take: number = 10) {
      const cacheKey = `identificationTypes:skip:${skip}:take:${take}`;
  
      const cachedData = await this.cacheManager.getCache<{
        data: any[];
        total: number;
      }>(cacheKey);
      if (cachedData) return cachedData;
  
      const [identificationTypes, total] = await this.identificationTypeRepository.findAndCount({
        where: { deletedAt: null },
        skip,
        take,
      });
  
      const result = {
        data: { identificationTypes, total },
        message: 'IdentificationType List',
      };
  
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    }
  
    async findById(id: string) {
      const cacheKey = `identificationType:${id}`;
  
      const cachedIdentificationType = await this.cacheManager.getCache<any>(cacheKey);
      if (cachedIdentificationType) return cachedIdentificationType;
  
      const identificationType = await this.identificationTypeRepository.findOne({
        where: { id, deletedAt: null }
      });
  
      if (!identificationType) {
        throw new NotFoundException(`IdentificationType with id ${id} not found`);
      }
  
      await this.cacheManager.setCache(cacheKey, identificationType, CACHE_TTL);
  
      return identificationType;
    }
  
    async update(id: string, identificationType: UpdateIdentificationTypeDto) {
      try {
        const existingIdentificationType = await this.identificationTypeRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingIdentificationType) {
          throw new NotFoundException(`IdentificationType with id ${id} not found`);
        }
  
        const updatedIdentificationType = await this.identificationTypeRepository.save({
          ...existingIdentificationType,
          ...identificationType,
        });
  
        await this.cacheManager.delCache(`identificationType:${id}`);
  
        return updatedIdentificationType;
      } catch (error) {
        throw new NotFoundException(`IdentificationType with id ${id} not found`);
      }
    }
  
    async remove(id: string) {
      try {
        const existingIdentificationType = await this.identificationTypeRepository.findOne({ where: { id, deletedAt: null } });
        if (!existingIdentificationType) {
          throw new NotFoundException(`IdentificationType with id ${id} not found`);
        }
  
        existingIdentificationType.deletedAt = new Date();
        const deletedIdentificationType = await this.identificationTypeRepository.save(existingIdentificationType);
  
        await this.cacheManager.delCache(`identificationType:${id}`);
  
        return deletedIdentificationType;
      } catch (error) {
        throw new NotFoundException(`IdentificationType with id ${id} not found`);
      }
    }
}
