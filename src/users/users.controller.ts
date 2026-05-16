import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
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

  @Get(':id')
  async getPublicProfile(@Param('id') id: number) {
    return this.usersService.getPublicProfile(id);
  }
}