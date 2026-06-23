import {
  Controller, Get, Post, Patch, Delete, Param, Body, Request, Res,
  UseGuards, Query, UseInterceptors, UploadedFiles, NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TracksService } from './tracks.service';
import { LikesService } from '../likes/likes.service';
import { S3Service } from '../storage/s3.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('tracks')
export class TracksController {
  constructor(
    private readonly tracksService: TracksService,
    private readonly likesService: LikesService,
    private readonly s3: S3Service,
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

  @Get('trending')
  async trending() {
    return this.tracksService.trending();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('flow')
  async flow(@Request() req) {
    return this.tracksService.flow(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async history(@Request() req) {
    return this.tracksService.history(req.user.id);
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

  @Get(':id/similar')
  async similar(@Param('id') id: number) {
    return this.tracksService.similar(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: number, @Res() res: Response) {
    const track = await this.tracksService.findOne(id);
    const stream = await this.s3.getStream(track.file_path);
    if (!stream) throw new NotFoundException('Файл трека не найден');

    const artist = track.user?.nickname
      || [track.user?.firstName, track.user?.lastName].filter(Boolean).join(' ')
      || 'NextSound';
    const ext = extname(track.file_path) || '.mp3';
    const niceName = `${artist} - ${track.title}${ext}`;
    const asciiName = niceName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');

    res.set({
      'Content-Type': stream.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(niceName)}`,
    });
    if (stream.contentLength) res.set('Content-Length', String(stream.contentLength));
    stream.body.pipe(res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  async toggleLike(@Param('id') trackId: number, @Request() req) {
    return this.likesService.toggleLike(req.user.id, trackId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/likes')
  async getLikesCount(@Param('id') trackId: number, @Request() req) {
    const count = await this.likesService.getLikesCount(trackId);
    const liked = req.user ? await this.likesService.isLiked(req.user.id, trackId) : false;
    return { count, liked };
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