import {
  Controller, Get, Post, Patch, Delete, Param, Body, Request,
  UseGuards, Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TracksService } from './tracks.service';
import { LikesService } from '../likes/likes.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('tracks')
export class TracksController {
  constructor(
    private readonly tracksService: TracksService,
    private readonly likesService: LikesService,
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]))
  async create(
    @Request() req,
    @UploadedFiles() files: { file?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const file = files?.file?.[0];
    const cover = files?.cover?.[0];
    return this.tracksService.create(body, file, cover, req.user.id);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.tracksService.search(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async getMyTracks(@Request() req) {
    return this.tracksService.findByUser(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('liked')
  async getLikedTracks(@Request() req) {
    return this.likesService.getUserLikedTracks(req.user.id);
  }

  @Get()
  async findAll() {
    return this.tracksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.tracksService.findOne(id);
  }

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
  @Post(':id/repost')
  async toggleRepost(@Param('id') trackId: number, @Request() req) {
    return this.tracksService.toggleRepost(req.user.id, trackId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/repost-info')
  async repostInfo(@Param('id') trackId: number, @Request() req) {
    return this.tracksService.repostInfo(trackId, req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/play')
  async incrementPlay(@Param('id') id: number, @Request() req) {
    return this.tracksService.recordPlay(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(@Param('id') id: number, @Request() req, @Body() updateData: any) {
    return this.tracksService.update(id, req.user.id, updateData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    return this.tracksService.remove(id, req.user.id);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: number) {
    return this.tracksService.findByUser(userId);
  }

  @Get('user/:userId/reposts')
  async getUserReposts(@Param('userId') userId: number) {
    return this.tracksService.getUserReposts(userId);
  }
}