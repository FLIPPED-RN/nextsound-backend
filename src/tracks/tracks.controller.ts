import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req, @Body() createTrackDto: CreateTrackDto) {
    return this.tracksService.create(createTrackDto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.tracksService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.tracksService.search(query);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyTracks(@Request() req) {
    return this.tracksService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.tracksService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(@Param('id') id: number, @Request() req, @Body() updateData: Partial<CreateTrackDto>) {
    return this.tracksService.update(id, req.user.id, updateData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    return this.tracksService.remove(id, req.user.id);
  }

  @Post(':id/play')
  async incrementPlay(@Param('id') id: number) {
    await this.tracksService.incrementPlays(id);
    return { message: 'Прослушивание засчитано' };
  }
}