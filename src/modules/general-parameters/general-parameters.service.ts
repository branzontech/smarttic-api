import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralParameter } from './entities/general-parameter.entity';
import { CreateGeneralParameterDto } from './dto/create-general-parameter.dto';
import { UpdateGeneralParameterDto } from './dto/update-general-parameter.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class GeneralParametersService {
  constructor(
    @InjectRepository(GeneralParameter)
    private readonly parameterRepository: Repository<GeneralParameter>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createDto: CreateGeneralParameterDto): Promise<GeneralParameter> {
    try {
      const existing = await this.parameterRepository.findOne({
        where: { key: createDto.key },
      });

      if (existing) {
        throw new ConflictException(`Key '${createDto.key}' already exists.`);
      }

      const parameter = this.parameterRepository.create(createDto);
      const saved = await this.parameterRepository.save(parameter);
      await this.cacheManager.delCache('general-parameters:*');

      return saved;
    } catch (error) {
      console.error('Error in create:', error);
      throw error instanceof ConflictException
        ? error
        : new InternalServerErrorException('Could not create the parameter.');
    }
  }

  async findAll(skip = 0, take = 10, filter?: string): Promise<{ data: GeneralParameter[]; total: number }> {
    try {
      const cacheKey = `general-parameters:skip:${skip}:take:${take}:filter:${filter || ''}`;
      const cachedParams = await this.cacheManager.getCache<{
        data: GeneralParameter[];
        total: number;
      }>(cacheKey);

      if (cachedParams) return cachedParams;

      const queryBuilder = this.parameterRepository
        .createQueryBuilder('param');

      if (filter) {
        queryBuilder.andWhere(
          `(param.key ILIKE :filter  OR param.description ILIKE :filter)`,
          { filter: `%${filter}%` },
        );
      }

      queryBuilder.orderBy('param.createdAt', 'DESC')
      queryBuilder.skip(skip).take(take);

      const [parameters, total] = await queryBuilder.getManyAndCount();

      const result = { data: parameters, total };
      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Could not retrieve parameters.');
    }
  }

  async findByKey(key: string): Promise<GeneralParameter> {
    try {
      const cacheKey = `general-parameter-by-key:${key}`;
      let param = await this.cacheManager.getCache<GeneralParameter>(cacheKey);
      if (!param) {
        param = await this.parameterRepository.findOne({ where: { key} });
        if (!param) {
          throw new NotFoundException(`Parameter with key '${key}' not found.`);
        }
        await this.cacheManager.setCache(cacheKey, param, CACHE_TTL);
      }
      return param;
    } catch (error) {
      console.error('Error in findByKey:', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Could not retrieve the parameter.');
    }
  }

  async findOne(id: string): Promise<GeneralParameter> {
    try {
      const cacheKey = `general-parameter:${id}`;
      let param = await this.cacheManager.getCache<GeneralParameter>(cacheKey);
      if (!param) {
        param = await this.parameterRepository.findOne({ where: { id } });
        if (!param) {
          throw new NotFoundException(`Parameter with ID '${id}' not found.`);
        }
        await this.cacheManager.setCache(cacheKey, param, CACHE_TTL);
      }
      return param;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Could not retrieve the parameter.');
    }
  }

  async update(id: string, updateDto: UpdateGeneralParameterDto): Promise<GeneralParameter> {
    try {
      const param = await this.parameterRepository.findOne({ where: { id } });
      if (!param) {
        throw new NotFoundException(`Parameter with ID '${id}' not found.`);
      }

      const updated = await this.parameterRepository.preload({
        id,
        ...updateDto,
      });

      const saved = await this.parameterRepository.save(updated);
      await this.cacheManager.delCache(`general-parameter:${id}`);
      await this.cacheManager.delCache('general-parameters:*');
      return saved;
    } catch (error) {
      console.error('Error in update:', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Could not update the parameter.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const param = await this.parameterRepository.findOne({ where: { id } });
      if (!param) {
        throw new NotFoundException(`Parameter with ID '${id}' not found.`);
      }

      await this.parameterRepository.softDelete(id);
      await this.cacheManager.delCache(`general-parameter:${id}`);
      await this.cacheManager.delCache('general-parameters:*');
    } catch (error) {
      console.error('Error in remove:', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Could not delete the parameter.');
    }
  }
}
