// typeorm.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { DatabaseType } from "src/common/types";

// Cargar variables de entorno desde .env
dotenv.config({
    path: '.env.development.local'
});

const dataSource = new DataSource({
  type: process.env.DATABASE_TYPE  as DatabaseType, 
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/src/modules/**/*.entity{.ts,.js}'], // Ajusta la ruta según tu estructura
  migrations: [__dirname + '/src/common/database/migrations/**/*{.ts,.js}'], // Ajusta la ruta según tu estructura
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
});
  
  
export default dataSource;
