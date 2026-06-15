import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Track } from '../tracks/entities/track.entity';
import { Play } from '../tracks/entities/play.entity';
import { Like } from '../likes/entities/like.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Playlist } from '../playlists/entities/playlist.entity';
import { PlaylistTrack } from '../playlists/entities/playlist-track.entity';
import { TracksService } from '../tracks/tracks.service';
import { Role } from '../auth/role.enum';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Track) private tracks: Repository<Track>,
    @InjectRepository(Play) private plays: Repository<Play>,
    @InjectRepository(Like) private likes: Repository<Like>,
    @InjectRepository(Comment) private comments: Repository<Comment>,
    @InjectRepository(Playlist) private playlists: Repository<Playlist>,
    @InjectRepository(PlaylistTrack) private playlistTracks: Repository<PlaylistTrack>,
    private tracksService: TracksService,
    private s3: S3Service,
  ) { }

  private clean(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }

  async getStats() {
    const [totalUsers, listeners, artists, admins] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { role: Role.Listener } }),
      this.users.count({ where: { role: Role.Artist } }),
      this.users.count({ where: { role: Role.Administrator } }),
    ]);

    const [totalTracks, publicTracks, privateTracks, linkTracks] = await Promise.all([
      this.tracks.count(),
      this.tracks.count({ where: { visibility: 'public' as any } }),
      this.tracks.count({ where: { visibility: 'private' as any } }),
      this.tracks.count({ where: { visibility: 'link' as any } }),
    ]);

    const [playlists, comments, likes, plays] = await Promise.all([
      this.playlists.count(),
      this.comments.count(),
      this.likes.count(),
      this.plays.count(),
    ]);

    const playsAgg = await this.tracks
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.plays_count),0)', 'sum')
      .getRawOne<{ sum: string }>();
    const totalPlays = Number(playsAgg?.sum || 0);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers7d = await this.users
      .createQueryBuilder('u')
      .where('u.created_at >= :d', { d: weekAgo })
      .getCount();
    const newTracks7d = await this.tracks
      .createQueryBuilder('t')
      .where('t.created_at >= :d', { d: weekAgo })
      .getCount();

    const [audioBytes, coverBytes, avatarBytes] = await Promise.all([
      this.s3.folderSize('audio'),
      this.s3.folderSize('covers'),
      this.s3.folderSize('avatars'),
    ]);
    const totalBytes = audioBytes + coverBytes + avatarBytes;

    const topTracks = await this.tracks.find({
      relations: ['user'],
      order: { plays_count: 'DESC' },
      take: 10,
    });
    const recentTracks = await this.tracks.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: 5,
    });
    const recentUsers = (await this.users.find({ order: { created_at: 'DESC' }, take: 5 }))
      .map((u) => this.clean(u));

    return {
      users: { total: totalUsers, listeners, artists, admins, new7d: newUsers7d },
      tracks: { total: totalTracks, public: publicTracks, private: privateTracks, link: linkTracks, new7d: newTracks7d },
      engagement: { playlists, comments, likes, uniquePlays: plays, totalPlays },
      storage: { totalBytes, audioBytes, coverBytes, avatarBytes },
      topTracks: topTracks.map((t) => ({ ...t, user: t.user ? this.clean(t.user) : null })),
      recentTracks: recentTracks.map((t) => ({ ...t, user: t.user ? this.clean(t.user) : null })),
      recentUsers,
    };
  }

  async listTracks() {
    const tracks = await this.tracks.find({ relations: ['user'], order: { created_at: 'DESC' } });
    return tracks.map((t) => ({ ...t, user: t.user ? this.clean(t.user) : null }));
  }

  async deleteTrack(id: number) {
    await this.tracksService.removeAsAdmin(id);
    return { message: 'Трек удалён' };
  }

  async setFeatured(id: number, featured: boolean) {
    const track = await this.tracks.findOne({ where: { id } });
    if (!track) throw new NotFoundException('Трек не найден');
    if (featured) {
      await this.tracks.createQueryBuilder().update().set({ isFeatured: false }).execute();
      await this.tracks.update({ id }, { isFeatured: true });
    } else {
      await this.tracks.update({ id }, { isFeatured: false });
    }
    return { ok: true, featured };
  }

  async listUsers() {
    const users = await this.users.find({ order: { created_at: 'DESC' } });
    const result: any[] = [];
    for (const u of users) {
      const trackCount = await this.tracks.count({ where: { userId: u.id } });
      result.push({ ...this.clean(u), trackCount });
    }
    return result;
  }

  async setRole(id: number, role: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (!Object.values(Role).includes(role as Role)) {
      throw new NotFoundException('Неизвестная роль');
    }
    await this.users.update({ id }, { role: role as Role });
    return this.clean((await this.users.findOne({ where: { id } }))!);
  }

  async setArtistVerified(id: number, verified: boolean) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    await this.users.update({ id }, { isArtistVerified: !!verified });
    return this.clean((await this.users.findOne({ where: { id } }))!);
  }

  async deleteUser(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const userTracks = await this.tracks.find({ where: { userId: id } });
    for (const t of userTracks) {
      await this.tracksService.removeAsAdmin(t.id);
    }
    const ownedPlaylists = await this.playlists.find({ where: { userId: id } });
    for (const p of ownedPlaylists) {
      await this.playlistTracks.delete({ playlistId: p.id });
    }
    await this.playlists.delete({ userId: id });
    await this.comments.delete({ userId: id });
    await this.likes.delete({ userId: id });
    await this.plays.delete({ userId: id });
    await this.users.delete({ id });
    return { message: 'Пользователь удалён' };
  }

  async listComments() {
    return this.comments.find({ relations: ['user'], order: { created_at: 'DESC' }, take: 200 });
  }

  async deleteComment(id: number) {
    await this.comments.delete({ id });
    return { message: 'Комментарий удалён' };
  }
}
