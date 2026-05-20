import { Controller, Post, Delete, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  async toggleLike(@Param('id') trackId: number, @Request() req) {
    return this.likesService.toggleLike(req.user.id, trackId);
  }

  @Get(':id/likes')
  async getLikesCount(@Param('id') trackId: number) {
    const count = await this.likesService.getLikesCount(trackId);
    return { count };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('liked')
  async getLikedTracks(@Request() req) {
    return this.likesService.getUserLikedTracks(req.user.id);
  }
}