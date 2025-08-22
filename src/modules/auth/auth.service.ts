import {
  HttpException,
  Injectable,
  InternalServerErrorException,
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
    if (!roles) throw new NotFoundException('No se encontraron roles');
    return {
      message: 'Roles recuperados exitosamente',
      data: roles,
    };
  }

  async logIn(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user)
      throw new NotFoundException(`Usuario con correo electrónico ${email} no encontrado`);

    const checkPassword = await compare(pass, user.password);
    if (!checkPassword) throw new UnauthorizedException("Usuario no autorizado. Rebice su usuario y contraseña");

    // Generar Tokens
    const tokens = await this.generateTokens(user.id, user.name);

    // Guardar Refresh Token en Redis con TTL de 4 horas
    const refreshTTL = Number(process.env.REFRESH_TTL) || 14400; // 4 horas
    await this.cacheManagerService.setSession(
      `refresh_${user.id}`,
      tokens.refresh_token,
      refreshTTL,
    );

    return {
      message: 'Autenticación exitosa',
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
      throw new UnauthorizedException('Se requiere token de actualización');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });

      // Validar que el refresh token aún está en Redis
      const storedToken = await this.cacheManagerService.getSession(
        `refresh_${payload.sub}`,
      );
      if (!storedToken) {
        throw new UnauthorizedException('La sesión ha expirado, por favor inicia sesión nuevamente');
      }
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Token de actualización no válido');
      }

      // Generar nuevo Access Token y actualizar el Refresh Token
      const tokens = await this.generateTokens(payload.sub, payload.name);

      // Actualizar Refresh Token en Redis
      const refreshTTL = Number(process.env.REFRESH_TTL) || 14400;
      await this.cacheManagerService.setSession(
        `refresh_${payload.sub}`,
        tokens.refresh_token,
        refreshTTL,
      );

      return { access_token: tokens.access_token };
    } catch (error) {
      throw new UnauthorizedException('Token de actualización no válida o caducada');
    }
  }

  async logout(userId: string) {
    await this.cacheManagerService.delSession(`refresh_${userId}`);
    return { message: 'El usuario cerró sesión exitosamente' };
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ) {
    await this.emailservice.sendEmail(to, subject, templateName, context);
  }

  async sendLinkResetPassword(
    email: string,
    requestIp: string,
    requestDevice: string,
  ) {
    try {
    
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException(
          `No se encontró un usuario con el correo ${email}`,
        );
      }
      
      let token;
      try {
        token = await this.generateTokens(user.id, user.name);
      } catch (err) {
        console.error('Error al generar el token de restablecimiento:', err);
        throw new InternalServerErrorException(
          'No se pudo generar el enlace de restablecimiento',
        );
      }

      const expirationMs  = parseInt(
        process.env.RESET_PASSWORD_EXPIRATION_MS || '1800000',
      );

      const payload = {
        id: user.id,
        token: token.access_token,
        timestamp: Date.now() + expirationMs ,
      };

      const encodedData = Buffer.from(JSON.stringify(payload)).toString(
        'base64',
      );
      const resetLink = `${process.env.FRONTEND_URL}/resetPassword?verify=${encodedData}`;

      const requestDate = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const expirationMinutes = Math.floor(expirationMs  / 60000);
      
      const emailContext = {
        fullname: user.name,
        resetLink,
        expirationTime: `${expirationMinutes} minutos`,
        requestDate,
        requestIp,
        requestDevice,
      };

      try {
        await this.emailservice.sendEmail(
          email,
          'Restablecer contraseña - SMART TIC',
          'reset-password-template.html',
          emailContext,
        );
      } catch (err) {
        console.error('Error al enviar el correo de restablecimiento:', err);
        throw new InternalServerErrorException(
          'No se pudo enviar el correo de restablecimiento',
        );
      }

      // 6. Respuesta exitosa
      return {
        message:
          'El enlace para restablecer tu contraseña ha sido enviado a tu correo electrónico.',
        data: {
          emailSentTo: email,
          expiration: `${expirationMinutes} minutos`,
        },
      };
    } catch (error) {
      console.error('Error en sendLinkResetPassword:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message:
          'Ocurrió un error inesperado al enviar el enlace de restablecimiento',
        error: error.message,
      });
    }
  }
}
