import {
  Body, Controller, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { FollowService } from './follow.service';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly followService: FollowService,
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/follow')
  async follow(@Param('id') id: number, @Request() req) {
    return this.followService.toggle(req.user.id, Number(id));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/follow-info')
  async followInfo(@Param('id') id: number, @Request() req) {
    return this.followService.info(Number(id), req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.profile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(@Request() req, @Body() body: any) {
    return this.usersService.updateMe(req.user.id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/password')
  async changePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('Новый пароль должен быть не короче 6 символов');
    }
    await this.usersService.changePasswod(req.user.id, body.oldPassword, body.newPassword);
    return { ok: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Get(':id')
  async getPublicProfile(@Param('id') id: number) {
    return this.usersService.getPublicProfile(id);
  }
}
