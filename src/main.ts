import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpCatchErrorFilter } from 'src/common/filters/http-catch-error.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { GLOBAL_PREFIX } from 'src/common/constants';
import { LoggerHelper } from 'src/common/helpers/logger.helper';
import { Repository } from 'typeorm';
import { Audit } from './modules/audits/entities/audit.entity';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const loggerHelper = app.get(LoggerHelper);

  app.useGlobalFilters(new HttpCatchErrorFilter( loggerHelper));
  app.useGlobalInterceptors(new ResponseInterceptor( loggerHelper)); 

  app.setGlobalPrefix(GLOBAL_PREFIX);

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API Branzontech Ticket')
    .setDescription('Documentation API Branzontech Ticket')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  // Crear el documento Swagger con el prefijo global
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${GLOBAL_PREFIX}/${controllerKey}.${methodKey}`,
  });

  SwaggerModule.setup(`swagger`, app, document);

  
  app.enableCors();

  // Configurar la ruta raíz para el mensaje personalizado
  app.getHttpAdapter().get('/', (_req, res) => {
    res.send('API Branzontech Ticket v1.0');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs are available at: http://localhost:${port}/swagger`);
}
bootstrap();
