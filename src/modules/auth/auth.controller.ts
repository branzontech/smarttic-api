import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { LogInDto } from 'src/modules/auth/dto/log-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() logInDto: LogInDto) {
    return await this.authService.logIn(logInDto.username, logInDto.password);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  async logout(@Body('userId') userId: string) {
    await this.authService.logout(userId);
    return { message: 'User logged out successfully' };
  }
}
