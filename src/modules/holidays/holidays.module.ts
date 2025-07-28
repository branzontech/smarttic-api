import { Module } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { HolidaysController } from './holidays.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { Holiday } from './entities/holidays.entity';
import { BranchModule } from '../branch/branch.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Holiday]),
    CacheManagerModule,
    BranchModule,
    UsersModule,
  ],
  controllers: [HolidaysController],
  providers: [HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
