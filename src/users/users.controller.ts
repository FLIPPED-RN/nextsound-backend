import {
  Body, Controller, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors,
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
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const path = file ? file.path.replace(/\\/g, '/') : '';
    return this.usersService.setAvatar(req.user.id, path);
  }

  @Get(':id')
  async getPublicProfile(@Param('id') id: number) {
    return this.usersService.getPublicProfile(id);
  }
}
