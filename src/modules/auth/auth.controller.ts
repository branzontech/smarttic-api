import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { LogInDto } from 'src/modules/auth/dto/log-in.dto';
import { 
  ApiTags, 
  ApiBody, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { SendEmailDto } from 'src/common/email/dto/send-email.dto';

@ApiTags('Auth') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}



  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticate a user and return an access token.' })
  @ApiBody({ 
    description: 'User login credentials', 
    type: LogInDto 
  })
  @ApiResponse({ status: 200, description: 'Successful login', schema: { type: 'object', properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() logInDto: LogInDto) {
    return await this.authService.logIn(logInDto.username, logInDto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token', description: 'Use a refresh token to obtain a new access token.' })
  @ApiBody({ 
    description: 'Refresh token for obtaining a new access token', 
    schema: { 
      type: 'object', 
      properties: { 
        refreshToken: { type: 'string' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', schema: { type: 'object', properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    console.log('Refresh token:', refreshToken);
    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout', description: 'Log out a user and invalidate their session.' })
  @ApiBody({ 
    description: 'User ID for logging out', 
    schema: { 
      type: 'object', 
      properties: { 
        userId: { type: 'string' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'User logged out successfully', schema: { type: 'object', properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  async logout(@Body('userId') userId: string) {
    await this.authService.logout(userId);
    return { message: 'User logged out successfully' };
  }


  @Get('roles')
  @ApiOperation({
    summary: 'Retrieve all roles',
    description: 'Returns a list of all available roles in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully'})
  async getRoles() {
    return await this.authService.getRoles();
  }

  @Post('sendEmail')
  @ApiOperation({
    summary: 'Send email',
    description: 'Send an email with a template and context.',
  })
  @ApiBody({
    type: SendEmailDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
  })
  async sendEmail(@Body() dto: SendEmailDto) {
    const { to, subject, templateName, context } = dto;
    return await this.authService.sendEmail(to, subject, templateName, context);
  }
}
