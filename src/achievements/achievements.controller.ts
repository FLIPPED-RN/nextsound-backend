import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async mine(@Request() req) {
    return this.achievementsService.getForUser(req.user.id, true);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('ping')
  async ping(@Request() req) {
    return this.achievementsService.ping(req.user.id);
  }

  @Get('user/:userId')
  async ofUser(@Param('userId') userId: number) {
    return this.achievementsService.getPublic(userId);
  }
}
