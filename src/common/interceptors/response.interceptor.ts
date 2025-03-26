import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
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
          this.loggerHelper.logRequest(request, 'SUCCESS  1', data?.message || 'Success');

          return {
            status: true, 
            statusCode,
            message:  data?.message || 'Success', 
            data: !data?.data ? data : data.data, 
            timestamp: new Date().toISOString(),
          };
        }),
      );
    }
  }
  