import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { PlaylistsService } from './playlists.service';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req, @Body('name') name: string) {
    return this.playlistsService.create(req.user.id, name);
  }

  @Get('exclusive')
  async getExclusive() {
    return this.playlistsService.findExclusive();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('exclusive')
  async createExclusive(@Request() req, @Body('name') name: string) {
    return this.playlistsService.create(req.user.id, name, true);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id/exclusive')
  async setExclusive(@Param('id') id: number, @Body('isExclusive') isExclusive: boolean) {
    return this.playlistsService.setExclusive(id, isExclusive);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover'))
  async setCover(@Param('id') id: number, @UploadedFile() cover: Express.Multer.File) {
    return this.playlistsService.setCover(id, cover);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMyPlaylists(@Request() req) {
    return this.playlistsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.playlistsService.findOne(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/tracks')
  async getTracks(@Param('id') id: number, @Request() req) {
    return this.playlistsService.getTracks(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/tracks')
  async addTrack(@Param('id') playlistId: number, @Request() req, @Body('trackId') trackId: number) {
    return this.playlistsService.addTrack(playlistId, req.user.id, trackId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/tracks/:trackId')
  async removeTrack(@Param('id') playlistId: number, @Param('trackId') trackId: number, @Request() req) {
    return this.playlistsService.removeTrack(playlistId, req.user.id, trackId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    return this.playlistsService.remove(id, req.user.id);
  }
}