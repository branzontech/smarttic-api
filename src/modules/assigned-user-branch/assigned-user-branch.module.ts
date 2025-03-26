import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedUserBranchService } from 'src/modules/assigned-user-branch/assigned-user-branch.service';
import { AssignedUserBranchController } from 'src/modules/assigned-user-branch/assigned-user-branch.controller';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { User } from 'src/modules/users/entities/user.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { AssignedUserBranch } from './entities/assigned-user-branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, User, AssignedUserBranch]),  CacheManagerModule],
  controllers: [AssignedUserBranchController],
  providers: [AssignedUserBranchService],
  exports: [AssignedUserBranchService, TypeOrmModule],
})
export class AssignedUserBranchModule {}
