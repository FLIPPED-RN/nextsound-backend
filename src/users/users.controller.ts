import {
  Body, Controller, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
