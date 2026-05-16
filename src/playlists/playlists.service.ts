import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track.entity';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistsRepository: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private playlistTracksRepository: Repository<PlaylistTrack>,
  ) { }

  async create(userId: number, name: string): Promise<Playlist> {
    const playlist = this.playlistsRepository.create({ name, userId });
    return this.playlistsRepository.save(playlist);
  }

  async findAllByUser(userId: number): Promise<Playlist[]> {
    return this.playlistsRepository.find({ where: { userId }, relations: ['user'] });
  }

  async findOne(id: number): Promise<Playlist> {
    const playlist = await this.playlistsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!playlist) throw new NotFoundException('Плейлист не найден');
    return playlist;
  }

  async getTracks(playlistId: number): Promise<PlaylistTrack[]> {
    return this.playlistTracksRepository.find({
      where: { playlistId },
      relations: ['track', 'track.user'],
    });
  }

  async addTrack(playlistId: number, userId: number, trackId: number): Promise<PlaylistTrack> {
    const playlist = await this.findOne(playlistId);
    if (playlist.userId !== userId) throw new ForbiddenException('Это не ваш плейлист');

    const existing = await this.playlistTracksRepository.findOne({ where: { playlistId, trackId } });
    if (existing) throw new ConflictException('Трек уже добавлен в этот плейлист');

    const entry = this.playlistTracksRepository.create({ playlistId, trackId });
    return this.playlistTracksRepository.save(entry);
  }

  async removeTrack(playlistId: number, userId: number, trackId: number): Promise<void> {
    const playlist = await this.findOne(playlistId);
    if (playlist.userId !== userId) throw new ForbiddenException('Это не ваш плейлист');

    await this.playlistTracksRepository.delete({ playlistId, trackId });
  }

  async remove(id: number, userId: number): Promise<void> {
    const playlist = await this.findOne(id);
    if (playlist.userId !== userId) throw new ForbiddenException('Это не ваш плейлист');
    await this.playlistsRepository.delete(id);
  }
}