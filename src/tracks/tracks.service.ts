import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track, TrackVisibility } from './entities/track.entity';
import { CreateTrackDto } from './dto/create-track.dto';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) { }

  async create(body: any, file?: Express.Multer.File, cover?: Express.Multer.File, userId?: number): Promise<Track> {
    const track = new Track();
    track.title = body.title;
    track.description = body.description || '';
    track.genre = body.genre || '';
    track.bpm = body.bpm ? Number(body.bpm) : 0;
    track.file_path = file ? file.path.replace(/\\/g, '/') : '';
    track.cover_path = cover ? cover.path.replace(/\\/g, '/') : '';
    track.userId = userId!;
    return this.tracksRepository.save(track);
  }

  async findAll(): Promise<Track[]> {
    return this.tracksRepository.find({
      where: { visibility: TrackVisibility.PUBLIC },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Track> {
    const track = await this.tracksRepository.findOne({ where: { id }, relations: ['user'] });
    if (!track) throw new NotFoundException('Трек не найден');
    return track;
  }

  async findByUser(userId: number): Promise<Track[]> {
    return this.tracksRepository.find({
      where: { userId },
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, userId: number, updateData: Partial<Track>): Promise<Track> {
    const track = await this.findOne(id);
    if (track.userId !== userId) throw new ForbiddenException('Вы не можете редактировать чужой трек');
    await this.tracksRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const track = await this.findOne(id);
    if (track.userId !== userId) throw new ForbiddenException('Вы не можете удалить чужой трек');

    await this.tracksRepository.manager.transaction(async (manager) => {
      await manager.delete('comment', { trackId: id });
      await manager.delete('like', { trackId: id });
      await manager.delete('playlist_track', { trackId: id });
      await manager.delete('track', { id });
    });
  }

  async incrementPlays(id: number): Promise<void> {
    await this.tracksRepository.increment({ id }, 'plays_count', 1);
  }

  async search(query: string): Promise<Track[]> {
    return this.tracksRepository
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.user', 'user')
      .where('track.title LIKE :query', { query: `%${query}%` })
      .orWhere('user.nickname LIKE :query', { query: `%${query}%` })
      .andWhere('track.visibility = :visibility', { visibility: TrackVisibility.PUBLIC })
      .orderBy('track.created_at', 'DESC')
      .getMany();
  }
}