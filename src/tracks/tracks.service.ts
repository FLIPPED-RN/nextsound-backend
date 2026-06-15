import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Track, TrackVisibility } from './entities/track.entity';
import { Play } from './entities/play.entity';
import { Repost } from './entities/repost.entity';
import { User } from '../users/entities/user.entity';
import { Follow } from '../users/entities/follow.entity';
import { Role } from '../auth/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
    @InjectRepository(Play)
    private playsRepository: Repository<Play>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Repost)
    private repostsRepository: Repository<Repost>,
    @InjectRepository(Follow)
    private followsRepository: Repository<Follow>,
    private notifications: NotificationsService,
    private s3: S3Service,
  ) { }

  async toggleRepost(userId: number, trackId: number) {
    const track = await this.findOne(trackId);
    const existing = await this.repostsRepository.findOne({ where: { userId, trackId } });
    if (existing) {
      await this.repostsRepository.remove(existing);
      return { reposted: false };
    }
    await this.repostsRepository.save(this.repostsRepository.create({ userId, trackId }));
    await this.notifications.notify(track.userId, 'repost', { actorId: userId, trackId });
    return { reposted: true };
  }

  async repostInfo(trackId: number, userId?: number) {
    const count = await this.repostsRepository.count({ where: { trackId } });
    let reposted = false;
    if (userId) reposted = !!(await this.repostsRepository.findOne({ where: { userId, trackId } }));
    return { count, reposted };
  }

  async getUserReposts(userId: number): Promise<Track[]> {
    const reposts = await this.repostsRepository.find({
      where: { userId },
      relations: ['track', 'track.user'],
      order: { created_at: 'DESC' },
    });
    return reposts.map((r) => r.track).filter(Boolean);
  }

  async create(body: any, file?: Express.Multer.File, cover?: Express.Multer.File, userId?: number): Promise<Track> {
    const track = new Track();
    track.title = body.title;
    track.description = body.description || '';
    track.genre = body.genre || '';
    track.featuring = body.featuring || null;
    track.bpm = body.bpm ? Number(body.bpm) : 0;
    track.file_path = file ? await this.s3.uploadFile(file, 'audio') : '';
    track.cover_path = cover ? await this.s3.uploadFile(cover, 'covers') : '';
    track.size = file?.size || 0;
    if (body.visibility) track.visibility = body.visibility;
    track.userId = userId!;
    const saved = await this.tracksRepository.save(track);

    if (userId) {
      await this.usersRepository.update({ id: userId, role: Role.Listener }, { role: Role.Artist });

      if (saved.visibility === TrackVisibility.PUBLIC) {
        const followers = await this.followsRepository.find({ where: { followingId: userId } });
        for (const f of followers) {
          await this.notifications.notify(f.followerId, 'new_track', { actorId: userId, trackId: saved.id });
        }
      }
    }

    return saved;
  }

  async trending(): Promise<Track[]> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.playsRepository
      .createQueryBuilder('p')
      .select('p.trackId', 'trackId')
      .addSelect('COUNT(*)', 'cnt')
      .where('p.created_at >= :d', { d: weekAgo })
      .groupBy('p.trackId')
      .orderBy('cnt', 'DESC')
      .limit(12)
      .getRawMany();

    const ids = rows.map((r) => Number(r.trackId));
    if (!ids.length) {
      return this.tracksRepository.find({
        where: { visibility: TrackVisibility.PUBLIC },
        relations: ['user'],
        order: { plays_count: 'DESC' },
        take: 12,
      });
    }

    const tracks = await this.tracksRepository.find({
      where: { id: In(ids), visibility: TrackVisibility.PUBLIC },
      relations: ['user'],
    });
    const map = new Map(tracks.map((t) => [t.id, t]));
    return ids.map((id) => map.get(id)).filter(Boolean) as Track[];
  }

  async similar(id: number): Promise<Track[]> {
    const track = await this.findOne(id);
    const qb = this.tracksRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.id != :id', { id })
      .andWhere('t.visibility = :v', { v: TrackVisibility.PUBLIC });
    if (track.genre) qb.andWhere('t.genre = :g', { g: track.genre });
    const result = await qb.orderBy('t.plays_count', 'DESC').limit(8).getMany();

    if (result.length < 4) {
      const extra = await this.tracksRepository.find({
        where: { visibility: TrackVisibility.PUBLIC },
        relations: ['user'],
        order: { plays_count: 'DESC' },
        take: 12,
      });
      const seen = new Set(result.map((t) => t.id));
      seen.add(id);
      for (const e of extra) {
        if (result.length >= 8) break;
        if (!seen.has(e.id)) { result.push(e); seen.add(e.id); }
      }
    }
    return result;
  }

  async history(userId: number): Promise<Track[]> {
    const plays = await this.playsRepository.find({
      where: { userId },
      relations: ['track', 'track.user'],
      order: { created_at: 'DESC' },
      take: 20,
    });
    return plays
      .map((p) => p.track)
      .filter((t) => t && t.visibility === TrackVisibility.PUBLIC);
  }

  private async deleteFiles(track: Track) {
    for (const p of [track.file_path, track.cover_path]) {
      if (!p) continue;
      await this.s3.deleteByUrl(p);
    }
  }

  private async cascadeDelete(id: number) {
    await this.tracksRepository.manager.transaction(async (manager) => {
      await manager.delete('comment', { trackId: id });
      await manager.delete('like', { trackId: id });
      await manager.delete('play', { trackId: id });
      await manager.delete('repost', { trackId: id });
      await manager.delete('playlist_track', { trackId: id });
      await manager.delete('track', { id });
    });
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
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, userId: number, updateData: Partial<Track>): Promise<Track> {
    const track = await this.findOne(id);
    if (track.userId !== userId) throw new ForbiddenException('Вы не можете редактировать чужой трек');

    const clean: Partial<Track> = {};
    if (updateData.title !== undefined) clean.title = updateData.title;
    if (updateData.description !== undefined) clean.description = updateData.description;
    if (updateData.genre !== undefined) clean.genre = updateData.genre;
    if (updateData.featuring !== undefined) clean.featuring = updateData.featuring;
    if (updateData.bpm !== undefined) clean.bpm = Number(updateData.bpm) || 0;
    if (updateData.visibility !== undefined) clean.visibility = updateData.visibility;

    await this.tracksRepository.update(id, clean);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const track = await this.findOne(id);
    if (track.userId !== userId) throw new ForbiddenException('Вы не можете удалить чужой трек');
    await this.deleteFiles(track);
    await this.cascadeDelete(id);
  }

  async removeAsAdmin(id: number): Promise<void> {
    const track = await this.findOne(id);
    await this.deleteFiles(track);
    await this.cascadeDelete(id);
  }

  async recordPlay(trackId: number, userId?: number): Promise<{ counted: boolean; plays: number }> {
    const track = await this.findOne(trackId);

    if (!userId) {
      return { counted: false, plays: track.plays_count };
    }

    const existing = await this.playsRepository.findOne({ where: { userId, trackId } });
    if (existing) {
      return { counted: false, plays: track.plays_count };
    }

    try {
      await this.playsRepository.save(this.playsRepository.create({ userId, trackId }));
      await this.tracksRepository.increment({ id: trackId }, 'plays_count', 1);
      return { counted: true, plays: track.plays_count + 1 };
    } catch {
      return { counted: false, plays: track.plays_count };
    }
  }

  async search(query: string): Promise<Track[]> {
    const term = (query || '').trim();

    if (!term) {
      return this.findAll();
    }

    return this.tracksRepository
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.user', 'user')
      .where('track.visibility = :visibility', { visibility: TrackVisibility.PUBLIC })
      .andWhere(
        '(LOWER(track.title) LIKE :q OR LOWER(track.genre) LIKE :q OR LOWER(user.nickname) LIKE :q OR LOWER(user.firstName) LIKE :q OR LOWER(user.lastName) LIKE :q)',
        { q: `%${term.toLowerCase()}%` },
      )
      .orderBy('track.plays_count', 'DESC')
      .getMany();
  }
}
