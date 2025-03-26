import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentificationTypeService } from 'src/modules/identification-type/identification-type.service';
import { IdentificationTypeController } from 'src/modules/identification-type/identification-type.controller';
import { IdentificationType } from 'src/modules/identification-type/entities/identification-type.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([IdentificationType]), UsersModule, CacheManagerModule],
  controllers: [IdentificationTypeController],
  providers: [IdentificationTypeService],
  exports: [IdentificationTypeService],
})
export class IdentificationTypeModule {}
