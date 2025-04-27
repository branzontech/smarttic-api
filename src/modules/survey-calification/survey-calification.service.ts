import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyCalification } from 'src/modules/survey-calification/entities/survey-calification.entity';
import { CreateSurveyCalificationDto } from 'src/modules/survey-calification/dto/create-survey-calification.dto';
import { UpdateSurveyCalificationDto } from 'src/modules/survey-calification/dto/update-survey-calification.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class SurveyCalificationService {
  constructor(
    @InjectRepository(SurveyCalification)
    private readonly surveyCalificationRepository: Repository<SurveyCalification>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createSurveyCalificationDto: CreateSurveyCalificationDto): Promise<SurveyCalification> {
    try {
      const existingSurvey = await this.surveyCalificationRepository.findOne({
        where: { title: createSurveyCalificationDto.title },
      });

      if (existingSurvey) {
        throw new ConflictException(`The title '${createSurveyCalificationDto.title}' already exists.`);
      }

      const survey = this.surveyCalificationRepository.create(createSurveyCalificationDto);
      const savedSurveyCalification = await this.surveyCalificationRepository.save(survey);

      await this.cacheManager.delCache(`surveyCalifications:*`);

      return savedSurveyCalification;
    } catch (error) {
      console.error('Error in create:', error);
      throw new InternalServerErrorException('Failed to create the survey calification.');
    }
  }

  async findAll(skip: number = 0, take: number = 10, filter?: string) {
    const cacheKey = `surveyCalifications:skip:${skip}:take:${take}:filter:${filter || ''}`;

    const cachedData = await this.cacheManager.getCache<{ data: any[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;

    const queryBuilder = this.surveyCalificationRepository.createQueryBuilder('surveyCalification');

    if (filter) {
      queryBuilder.andWhere('surveyCalifications.title ILIKE :filter OR surveyCalifications.description ILIKE :filter', {
        filter: `%${filter}%`,
      });
    }

    queryBuilder.skip(skip).take(take);

    const [surveyCalifications, total] = await queryBuilder.getManyAndCount();
    const result = { data: surveyCalifications, total };

    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<SurveyCalification> {
    const cacheKey = `surveyCalification:${id}`;

    try {
      const cachedSurvey = await this.cacheManager.getCache<SurveyCalification>(cacheKey);
      if (cachedSurvey) return cachedSurvey;

      const survey = await this.surveyCalificationRepository.findOne({ where: { id } });

      if (!survey) {
        throw new NotFoundException(`Survey calification with ID '${id}' not found.`);
      }

      await this.cacheManager.setCache(cacheKey, survey, CACHE_TTL);

      return survey;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to retrieve the survey calification.');
    }
  }

  async update(id: string, updateSurveyCalificationDto: UpdateSurveyCalificationDto): Promise<SurveyCalification> {
    try {
      const survey = await this.surveyCalificationRepository.preload({ id, ...updateSurveyCalificationDto });

      if (!survey) {
        throw new NotFoundException(`Survey calification with ID '${id}' not found.`);
      }

      const updatedSurvey = await this.surveyCalificationRepository.save(survey);

      await this.cacheManager.delCache(`surveyCalification:${id}`);

      return updatedSurvey;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException('Failed to update the survey calification.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const survey = await this.surveyCalificationRepository.findOne({ where: { id } });

      if (!survey) {
        throw new NotFoundException(`Survey calification with ID '${id}' not found.`);
      }

      await this.surveyCalificationRepository.softDelete(survey);

      await this.cacheManager.delCache(`surveyCalification:${id}`);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException('Failed to delete the survey calification.');
    }
  }
}
