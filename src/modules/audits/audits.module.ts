import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditsService } from 'src/modules/audits/audits.service';
import { AuditsController } from 'src/modules/audits/audits.controller';
import { Audit } from 'src/modules/audits/entities/audit.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';

@Module({
  imports: [TypeOrmModule.forFeature([Audit]), UsersModule, CacheManagerModule],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService, TypeOrmModule],
})
export class AuditsModule {}
