import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { RolesService } from '../roles/roles.service';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly emailservice: EmailService,
  ) {}
  
  async getRoles() {
    const roles = await this.rolesService.findAllAvailable();
    if (!roles) throw new NotFoundException('No roles found');
    return {
      message: 'Roles retrieved successfully',
      data: roles,
    };
  }

  async logIn(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);
  
    if (!user) throw new NotFoundException(`User with email ${username} not found`);

    const checkPassword = await compare(pass, user.password);
    if (!checkPassword) throw new UnauthorizedException();

    // Generar Tokens
    const tokens = await this.generateTokens(user.id, user.name);

    // Guardar Refresh Token en Redis con TTL de 4 horas
    const refreshTTL = Number(process.env.REFRESH_TTL) || 14400; // 4 horas
    await this.cacheManagerService.setSession(`refresh_${user.id}`, tokens.refresh_token, refreshTTL);

    return {
      message: 'Authentication Successful',
      data: tokens,
    };
  }

  async generateTokens(userId: string, name: string) {
    const payload = { sub: userId, name };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.EXPIRES_IN || '1h',
      secret: process.env.SECRET_KEY,
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.REFRESH_EXPIRES_IN || '4h',
      secret: process.env.REFRESH_SECRET,
    });

    return { access_token, refresh_token };
  }
  
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
  
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });
  
      // Validar que el refresh token aún está en Redis
      const storedToken = await this.cacheManagerService.getSession(`refresh_${payload.sub}`);
      if (!storedToken) {
        throw new UnauthorizedException('Session expired, please log in again');
      }
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
  
      // Generar nuevo Access Token y actualizar el Refresh Token
      const tokens = await this.generateTokens(payload.sub, payload.name);
  
      // Actualizar Refresh Token en Redis
      const refreshTTL = Number(process.env.REFRESH_TTL) || 14400;
      await this.cacheManagerService.setSession(`refresh_${payload.sub}`, tokens.refresh_token, refreshTTL);
  
      return { access_token: tokens.access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.cacheManagerService.delSession(`refresh_${userId}`);
    return { message: 'User logged out successfully' };
  }

  async sendEmail(to:string, subject:string, templateName:string, context: Record<string, any>){
    await this.emailservice.sendEmail(to, subject, templateName, context);
  }
}
