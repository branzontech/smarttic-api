import { Module } from '@nestjs/common';
import { GeneralParametersService } from './general-parameters.service';
import { GeneralParametersController } from './general-parameters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralParameter } from './entities/general-parameter.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([GeneralParameter]), CacheManagerModule, UsersModule],
  controllers: [GeneralParametersController],
  providers: [GeneralParametersService],
  exports: [GeneralParametersService],
})
export class GeneralParametersModule {}
