import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Album } from './entities/album.entity';
import { Track, TrackVisibility } from '../tracks/entities/track.entity';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album) private albums: Repository<Album>,
    @InjectRepository(Track) private tracks: Repository<Track>,
    private s3: S3Service,
  ) { }

  async create(userId: number, title: string, cover?: Express.Multer.File): Promise<Album> {
    const album = new Album();
    album.title = (title || 'Без названия').trim();
    album.userId = userId;
    if (cover) album.cover_path = await this.s3.uploadFile(cover, 'covers');
    return this.albums.save(album);
  }

  async recent(): Promise<any[]> {
    const albums = await this.albums.find({ relations: ['user'], order: { created_at: 'DESC' }, take: 30 });
    const result: any[] = [];
    for (const a of albums) {
      const tracks = await this.tracks.find({ where: { albumId: a.id }, order: { created_at: 'ASC' } });
      if (!tracks.length) continue;
      const cover = a.cover_path || tracks[0]?.cover_path || null;
      const { password, verifyCode, verifyExpires, ...user } = (a.user || {}) as any;
      result.push({ ...a, user, cover_path: cover, trackCount: tracks.length });
      if (result.length >= 12) break;
    }
    return result;
  }

  async findByUser(userId: number): Promise<any[]> {
    const albums = await this.albums.find({ where: { userId }, order: { created_at: 'DESC' } });
    const result: any[] = [];
    for (const a of albums) {
      const tracks = await this.tracks.find({ where: { albumId: a.id }, order: { created_at: 'ASC' } });
      const cover = a.cover_path || tracks[0]?.cover_path || null;
      result.push({ ...a, cover_path: cover, trackCount: tracks.length });
    }
    return result;
  }

  async findOne(id: number): Promise<any> {
    const album = await this.albums.findOne({ where: { id }, relations: ['user'] });
    if (!album) throw new NotFoundException('Альбом не найден');
    const tracks = await this.tracks.find({
      where: { albumId: id },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
    const cover = album.cover_path || tracks[0]?.cover_path || null;
    const plays = tracks.reduce((s, t) => s + (t.plays_count || 0), 0);
    return { ...album, cover_path: cover, tracks, trackCount: tracks.length, plays };
  }

  async remove(id: number, userId: number): Promise<void> {
    const album = await this.albums.findOne({ where: { id } });
    if (!album) throw new NotFoundException('Альбом не найден');
    if (album.userId !== userId) throw new ForbiddenException('Это не ваш альбом');
    await this.tracks.update({ albumId: id }, { albumId: null });
    if (album.cover_path) await this.s3.deleteByUrl(album.cover_path);
    await this.albums.delete({ id });
  }

  async listForUpload(userId: number): Promise<Album[]> {
    return this.albums.find({ where: { userId }, order: { created_at: 'DESC' } });
  }
}
