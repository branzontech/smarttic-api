import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuditDto } from 'src/modules/audits/dto/create-audit.dto';
import { Audit } from 'src/modules/audits/entities/audit.entity';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async create(createAuditDto: CreateAuditDto): Promise<Audit> {
    try {
      const audit = this.auditRepository.create(createAuditDto);
      const savedAudit =  await this.auditRepository.save(audit);
      await this.cacheManager.delCache(`audits:*`);
      return savedAudit;
    } catch (error) {
      console.error('Error creating audit log:', error.message);
      throw error;
    }
  }

  async findAll(skip: number = 0, take: number = 10) {
    const cacheKey = `audits:skip:${skip}:take:${take}`;

    // Verificar si los datos están en caché
    const cachedData = await this.cacheManager.getCache<{
      data: any[];
      total: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const [audits, total] = await this.auditRepository.findAndCount({
      skip,
      take,
    });

    
    const result = {
      data: { audits, total },
      message: 'Audit List',
    };

    // Guardar en caché
    await this.cacheManager.setCache(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findByUserId(userId: string) {
    const cacheKey = `audit-userId:${userId}`;

    const cachedUser = await this.cacheManager.getCache<any>(cacheKey);
    if (cachedUser) return cachedUser;

    const audit = await this.auditRepository.find({
      where: { userId },
    });

    if (!audit) {
      throw new NotFoundException(`audit with userId ${userId} not found`);
    }

    await this.cacheManager.setCache(cacheKey, audit, CACHE_TTL);

    return audit;
  }
}
