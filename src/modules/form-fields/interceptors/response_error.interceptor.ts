import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ResponseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Verifica si es una excepción de validación
        if (error instanceof BadRequestException) {
          const response = error.getResponse();

          let originalMessages: string[] = [];

          // Verifica que la respuesta tenga mensajes de error como array
          if (
            typeof response === 'object' &&
            response !== null &&
            Array.isArray((response as any).message)
          ) {
            originalMessages = (response as any).message;
          } else {
            return throwError(() => error); // No es una estructura esperada
          }

          const request = context.switchToHttp().getRequest();
          const body = request.body;
          const fields = body?.fields ?? [];

          const customMessages = originalMessages.map((msg: string) => {
            const match = msg.match(/^fields\.(\d+)\.(\w+)/);

            if (match) {
              const index = parseInt(match[1], 10);
              const property = match[2];
              const field = fields[index];
              const label = field?.label || `Campo #${index + 1}`;
              const type = field?.type || 'desconocido';

              if (property === 'options') {
                if (type === 'select' || type === 'checkbox') {
                  return `El campo "${label}" requiere un objeto como options. Ejemplo: { "options": ["Opción 1", "Opción 2"], "multiple": false }`;
                } else {
                  return `El campo "${label}" no necesita opciones (type: ${type}), pero se recibió un formato incorrecto.`;
                }
              }

              return `Error en el campo "${label}" → ${property}: ${msg.split(': ').pop()}`;
            }

            return msg;
          });

          return throwError(() => {
            return new BadRequestException({
              statusCode: 400,
              message: customMessages,
              error: 'Bad Request',
            });
          });
        }

        return throwError(() => error);
      }),
    );
  }
}
