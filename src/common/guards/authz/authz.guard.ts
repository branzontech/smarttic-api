import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { extractTokenFromHeader } from 'src/common/helpers/token.helper';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly cacheManagerService: CacheManagerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY, 
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.sub;

    let user = await this.cacheManagerService.getSession(userId);

    if (!user) {
      // 🔹 Intentamos recuperar el usuario desde la BD si no está en cache
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.permissions'],
        select: {
          id: true,
          role: {
            id: true, 
            isConfigurator: true,
            permissions: {
              endpoint: true,
              methods: true,
            },
          },
        },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // 🔹 Guardamos en caché con TTL de 1 hora (ajustable)
      const sessionTTL = Number(process.env.CACHE_SESSION_TTL) || 3600;
      await this.cacheManagerService.setSession(userId, user, sessionTTL);
    }

    request['user'] = user;

    // ✅ Validar permisos del usuario
    const { method, route } = request;
    const endpoint = route.path;

    const hasPermission = user.role.permissions.some(
      (perm) => perm.endpoint === endpoint && perm.methods.includes(method)
    );

    if (!hasPermission && !user.role.isConfigurator) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
