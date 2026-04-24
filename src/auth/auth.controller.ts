import { Body, Controller, Get, HttpCode, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response) {
    const { user, token } = await this.authService.login(req.user)
    response.cookie('token', token, {
      maxAge: 48 * 60 * 60 * 1000,
      httoOnly: true,
      signed: true
    })

    return { messgages: 'Успешный вход', result: { user } }
  }

  @Post('signup')
  async signUp(@Body() body: CreateUserDto) {
    const user = await this.authService.create(body)
    return { messgages: 'Пользователь создан', result: user }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logout')
  async logout(@Request() req, @Res({ passthrough: true }) response) {
    response.clearCookie('token')
    return {}
  }
}
