import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    StreamableFile,
  } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerHelper } from 'src/common/helpers/logger.helper';
  
  @Injectable()
  export class ResponseInterceptor implements NestInterceptor {
    constructor(private readonly loggerHelper: LoggerHelper) {}
        

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map((data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode || 200;
          const request = context.switchToHttp().getRequest<Request>();
          this.loggerHelper.logRequest(request, 'SUCCESS', data?.message || 'Success');

          if (
            data instanceof StreamableFile ||
            Buffer.isBuffer(data) ||
            data instanceof Uint8Array
          ) {
            return data; 
          }

          return {
            status: true, 
            statusCode,
            message:  data?.message || 'Success', 
            resultData: data , 
            timestamp: new Date().toISOString(),
          };
        }),
      );
    }
  }
  