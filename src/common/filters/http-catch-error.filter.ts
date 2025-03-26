import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerHelper } from 'src/common/helpers/logger.helper';

@Catch()
@Injectable()
export class HttpCatchErrorFilter implements ExceptionFilter {
  constructor(private readonly loggerHelper: LoggerHelper) {}

  async catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    let statusCode = 500;
    let message = 'Internal Server Error' ;
    let data = null;
    let exceptionType = exception.constructor.name;

    // Manejo de HttpException (errores lanzados explícitamente)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'object' && responseBody['message']) {
        // Caso de errores de validación
        message = responseBody['message'];
      } else {
        message = responseBody as string;
      }
    } else if (
      exception['response']?.statusCode === 400 &&
      exception['response']?.message
    ) {
      // Manejo explícito de errores de validación personalizados
      statusCode = 400;
      message = 'Validation Error';
      data = exception['response']?.message;
    } else {
      // Otros errores
      data = exception?.message || null;
    }

    // Registrar el error
    await this.loggerHelper.logRequest(
      request,
      exceptionType,
      `${message} - Stack trace: ${exception.stack || 'No stack trace'}`,
    );

    response.status(statusCode).json({
      status: false,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
