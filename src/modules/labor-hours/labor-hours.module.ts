import { Module } from '@nestjs/common';
import { LaborHoursService } from './labor-hours.service';
import { LaborHoursController } from './labor-hours.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { LaborHour } from './entities/labor-hours.entity';
import { BranchModule } from '../branch/branch.module';
import { UsersModule } from 'src/modules/users/users.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([LaborHour]),
    CacheManagerModule,
    BranchModule,
    UsersModule, 
  ],
  controllers: [LaborHoursController],
  providers: [LaborHoursService],
  exports: [LaborHoursService],
})
export class LaborHoursModule {}
