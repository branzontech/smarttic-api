import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    if (!request.user) {
      return null; // Retornar null si no hay usuario (para evitar errores)
    }
    // Si se pasa un argumento, devolver solo esa propiedad
    return data ? request.user[data] : request.user;
  },
);