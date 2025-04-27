import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { CreateSurveyResponseDto } from 'src/modules/survey-response/dto/create-survey-response.dto';
import { UpdateSurveyResponseDto } from 'src/modules/survey-response/dto/update-survey-response.dto';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class SurveyResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: Repository<SurveyResponse>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(
    createSurveyResponseDto: CreateSurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const existingResponse = await this.surveyResponseRepository.findOne({
        where: {
          userId: createSurveyResponseDto.userId,
          surveyCalificationId: createSurveyResponseDto.surveyCalificationId,
        },
      });

      if (existingResponse) {
        throw new ConflictException(
          'The user has already responded to this survey.',
        );
      }

      const response = this.surveyResponseRepository.create(
        createSurveyResponseDto,
      );
      const saved = await this.surveyResponseRepository.save(response);

      await this.cacheManager.delCache('surveyResponses:*');

      return saved;
    } catch (error) {
      console.error('Error in create:', error);
      throw new InternalServerErrorException(
        'Failed to create the survey response.',
      );
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
  ): Promise<{ data: SurveyResponse[]; total: number }> {
    const cacheKey = `surveyResponses:skip:${skip}:take:${take}:filter:${filter || ''}`;

    try {
      const cached = await this.cacheManager.getCache<{
        data: SurveyResponse[];
        total: number;
      }>(cacheKey);
      if (cached) return cached;

      const queryBuilder =
        this.surveyResponseRepository.createQueryBuilder('surveyResponse');

      if (filter) {
        queryBuilder.andWhere(
          'surveyResponse.title ILIKE :filter OR surveyResponse.description ILIKE :filter',
          {
            filter: `%${filter}%`,
          },
        );
      }

      queryBuilder.skip(skip).take(take);

      const [surveyCalifications, total] = await queryBuilder.getManyAndCount();
      const result = { data: surveyCalifications, total };

      await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve the list of survey responses.',
      );
    }
  }

  async findOne(id: string): Promise<SurveyResponse> {
    const cacheKey = `surveyResponse:${id}`;

    try {
      const cached = await this.cacheManager.getCache<SurveyResponse>(cacheKey);
      if (cached) return cached;

      const response = await this.surveyResponseRepository.findOne({
        where: { id },
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      await this.cacheManager.setCache(cacheKey, response, CACHE_TTL);

      return response;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve the survey response.',
      );
    }
  }

  async update(
    id: string,
    updateSurveyResponseDto: UpdateSurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const response = await this.surveyResponseRepository.preload({
        id,
        ...updateSurveyResponseDto,
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      const updated = await this.surveyResponseRepository.save(response);

      await Promise.all([
        this.cacheManager.delCache(`surveyResponse:${id}`),
        this.cacheManager.delCache('surveyResponses:*'),
      ]);

      return updated;
    } catch (error) {
      console.error('Error in update:', error);
      throw new InternalServerErrorException(
        'Failed to update the survey response.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const response = await this.surveyResponseRepository.findOne({
        where: { id },
      });

      if (!response) {
        throw new NotFoundException(
          `Survey response with ID '${id}' not found.`,
        );
      }

      await this.surveyResponseRepository.softRemove(response);

      await Promise.all([
        this.cacheManager.delCache(`surveyResponse:${id}`),
        this.cacheManager.delCache('surveyResponses:*'),
      ]);
    } catch (error) {
      console.error('Error in remove:', error);
      throw new InternalServerErrorException(
        'Failed to delete the survey response.',
      );
    }
  }
}
