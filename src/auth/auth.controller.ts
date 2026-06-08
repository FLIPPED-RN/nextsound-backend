import { Body, Controller, ForbiddenException, Get, HttpCode, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setAuthCookie(response, token: string) {
    response.cookie('token', token, {
      maxAge: 48 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
  }

  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response) {
    if (process.env.MAIL_ENABLED === 'true' && !req.user.isVerified) {
      throw new ForbiddenException({ message: 'Подтвердите почту', needVerification: true, email: req.user.email });
    }
    const { user, token } = await this.authService.login(req.user)
    this.setAuthCookie(response, token);
    return { messgages: 'Успешный вход', result: { user } }
  }

  @Post('signup')
  async signUp(@Body() body: CreateUserDto) {
    return this.authService.create(body)
  }

  @HttpCode(200)
  @Post('verify')
  async verify(@Body() body: { email: string; code: string }, @Res({ passthrough: true }) response) {
    const { user, token } = await this.authService.verifyEmail(body.email, body.code)
    this.setAuthCookie(response, token);
    return { messgages: 'Почта подтверждена', result: { user } }
  }

  @HttpCode(200)
  @Post('resend')
  async resend(@Body() body: { email: string }) {
    return this.authService.resend(body.email)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logout')
  async logout(@Request() req, @Res({ passthrough: true }) response) {
    response.clearCookie('token')
    return {}
  }
}
