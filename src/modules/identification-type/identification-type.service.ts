import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
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
      const existingIdentificationType = await this.identificationTypeRepository.findOne({
        where: { description: createIdentificationTypeDto.description },
      });

      if (existingIdentificationType) {
        throw new ConflictException(`Identification type '${createIdentificationTypeDto.description}' already exists.`);
      }

      const identificationType = this.identificationTypeRepository.create(createIdentificationTypeDto);
      const savedIdentificationType = await this.identificationTypeRepository.save(identificationType);
      await this.cacheManager.delCache(`identificationTypes:*`);
      return savedIdentificationType;
    } catch (error) {
      console.error('Error in create:', error);
      throw new InternalServerErrorException('Could not create the identification type.');
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    try {
      const cacheKey = `identificationTypes:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedData = await this.cacheManager.getCache<{ data: IdentificationType[]; total: number }>(cacheKey);
      
      if (cachedData) return cachedData;
  
      const queryBuilder = this.identificationTypeRepository.createQueryBuilder('identificationType')
        .where('identificationType.deletedAt IS NULL');
  
    
      if (filter) {
        queryBuilder.andWhere(
          `identificationType.code ILIKE :filter OR
           identificationType.description ILIKE :filter`,
          { filter: `%${filter}%` }
        );
      }
  
      
      queryBuilder.skip(skip).take(take);
  
      const [identificationTypes, total] = await queryBuilder.getManyAndCount();
  
      const result = { data: identificationTypes, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);
  
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Could not retrieve the list of identification types.');
    }
  }
  

  async findById(id: string): Promise<IdentificationType> {
    try {
      const cacheKey = `identificationType:${id}`;
      let identificationType = await this.cacheManager.getCache<IdentificationType>(cacheKey);

      if (!identificationType) {
        identificationType = await this.identificationTypeRepository.findOne({ where: { id } });
        if (!identificationType) {
          throw new NotFoundException(`Identification type with ID '${id}' not found.`);
        }
        await this.cacheManager.setCache(cacheKey, identificationType);
      }

      return identificationType;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new InternalServerErrorException('Could not retrieve the identification type.');
    }
  }

  async update(id: string, updateIdentificationTypeDto: UpdateIdentificationTypeDto): Promise<IdentificationType> {
    try {
      const identificationType = await this.identificationTypeRepository.preload({ id, ...updateIdentificationTypeDto });

      if (!identificationType) {
        throw new NotFoundException(`Identification type with ID '${id}' not found.`);
      }

      const updatedIdentificationType = await this.identificationTypeRepository.save(identificationType);
      await this.cacheManager.delCache(`identificationType:${id}`);
      await this.cacheManager.delCache(`identificationTypes:*`);
      
      return updatedIdentificationType;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException('Could not update the identification type.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const identificationType = await this.identificationTypeRepository.findOne({ where: { id } });
      
      if (!identificationType) {
        throw new NotFoundException(`Identification type with ID '${id}' not found.`);
      }

      await this.identificationTypeRepository.softDelete(id);
      await this.cacheManager.delCache(`identificationType:${id}`);
      await this.cacheManager.delCache(`identificationTypes:*`);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException('Could not delete the identification type.');
    }
  }
}