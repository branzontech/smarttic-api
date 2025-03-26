import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { Branch } from './entities/branch.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from 'src/modules/users/users.module';


@Module({
  imports: [TypeOrmModule.forFeature([Branch]), UsersModule, CacheManagerModule],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
