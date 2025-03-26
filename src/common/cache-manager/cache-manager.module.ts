import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          ttl: configService.get<number>('CACHE_TTL', 300), // Default: 5 min
        }),
      }),
    }),
  ],
  providers: [CacheManagerService],
  exports: [CacheManagerService], 
})
export class CacheManagerModule {}
