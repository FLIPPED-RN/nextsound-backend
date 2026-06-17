import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track.entity';
import { User } from '../users/entities/user.entity';
import { isSubscriber } from '../common/plans';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistsRepository: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private playlistTracksRepository: Repository<PlaylistTrack>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(userId: number, name: string, isExclusive = false): Promise<Playlist> {
    const playlist = this.playlistsRepository.create({ name, userId, isExclusive });
    return this.playlistsRepository.save(playlist);
  }

  async setExclusive(id: number, isExclusive: boolean): Promise<Playlist> {
    const playlist = await this.findOne(id);
    await this.playlistsRepository.update(id, { isExclusive });
    return { ...playlist, isExclusive };
  }

  async findExclusive(): Promise<any[]> {
    const playlists = await this.playlistsRepository.find({
      where: { isExclusive: true },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
    const result: any[] = [];
    for (const p of playlists) {
      const tracks = await this.playlistTracksRepository.find({ where: { playlistId: p.id }, relations: ['track'] });
      const cover = tracks.find((t) => t.track?.cover_path)?.track?.cover_path || null;
      result.push({ id: p.id, name: p.name, isExclusive: true, cover_path: cover, trackCount: tracks.length });
    }
    return result;
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

  async getTracks(playlistId: number, requesterId?: number): Promise<PlaylistTrack[]> {
    const playlist = await this.playlistsRepository.findOne({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Плейлист не найден');

    if (playlist.isExclusive) {
      const requester = requesterId
        ? await this.usersRepository.findOne({ where: { id: requesterId } })
        : null;
      const allowed = !!requester &&
        (requester.id === playlist.userId || requester.role === 'admin' || isSubscriber(requester));
      if (!allowed) {
        throw new ForbiddenException('Этот плейлист доступен только по подписке NextSound Plus');
      }
    }

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