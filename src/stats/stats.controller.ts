import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async mine(@Request() req) {
    return this.statsService.forArtist(req.user.id);
  }
}
