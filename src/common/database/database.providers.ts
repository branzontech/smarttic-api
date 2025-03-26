import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './database.config';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource(
        Object.assign({}, getTypeOrmConfig(configService), {
          migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        }) as DataSourceOptions,
      );

      return dataSource.initialize();
    },
    inject: [ConfigService],
  },
];
