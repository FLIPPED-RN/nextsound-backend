import {
  Body, Controller, Delete, Get, Param, Post, Request, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlbumsService } from './albums.service';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  async create(@Request() req, @Body() body: any, @UploadedFile() cover?: Express.Multer.File) {
    return this.albumsService.create(req.user.id, body.title, cover);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('mine')
  async mine(@Request() req) {
    return this.albumsService.listForUpload(req.user.id);
  }

  @Get('recent')
  async recent() {
    return this.albumsService.recent();
  }

  @Get('user/:userId')
  async byUser(@Param('userId') userId: number) {
    return this.albumsService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.albumsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    await this.albumsService.remove(id, req.user.id);
    return { message: 'Альбом удалён' };
  }
}
