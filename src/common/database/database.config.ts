
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseType } from '../types';


export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: configService.get<DatabaseType>('DATABASE_TYPE'),
  host: configService.get<string>('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USERNAME'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: ['migrations/**/*{.ts,.js}'],
  synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE', false), // ¡Cuidado! No usar en producción
  logging: configService.get<boolean>('DATABASE_LOGGING', false),
});

