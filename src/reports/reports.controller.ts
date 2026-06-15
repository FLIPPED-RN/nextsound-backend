import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('tracks')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/report')
  async report(@Param('id') trackId: number, @Request() req, @Body('reason') reason: string) {
    return this.reportsService.create(req.user.id, trackId, reason);
  }
}
