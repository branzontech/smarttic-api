import { Module } from '@nestjs/common';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { EmailModule } from 'src/common/email/email.module';

@Module({
  imports: [
    UsersModule, 
    RolesModule,
    CacheManagerModule,
    EmailModule,
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_KEY, 
      signOptions: { expiresIn: process.env.EXPIRES_IN || '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}



