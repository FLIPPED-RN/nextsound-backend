import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Track } from '../tracks/entities/track.entity';

interface NotifyOpts {
  actorId: number;
  trackId?: number | null;
  commentId?: number | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(Track) private tracks: Repository<Track>,
  ) { }

  async notify(userId: number, type: string, opts: NotifyOpts) {
    if (!userId || userId === opts.actorId) return;
    const n = this.notifications.create({
      userId,
      type,
      actorId: opts.actorId,
      trackId: opts.trackId ?? null,
      commentId: opts.commentId ?? null,
    });
    await this.notifications.save(n);
  }

  async list(userId: number) {
    const items = await this.notifications.find({
      where: { userId },
      relations: ['actor'],
      order: { created_at: 'DESC' },
      take: 50,
    });

    const trackIds = [...new Set(items.map((i) => i.trackId).filter(Boolean))] as number[];
    const tracks = trackIds.length
      ? await this.tracks.find({ where: { id: In(trackIds) } })
      : [];
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    return items.map((i) => {
      const { password, verifyCode, verifyExpires, ...actor } = (i.actor || {}) as any;
      const track = i.trackId ? trackMap.get(i.trackId) : null;
      return {
        ...i,
        actor,
        trackTitle: track?.title || null,
        trackCover: track?.cover_path || null,
      };
    });
  }

  async unreadCount(userId: number) {
    const count = await this.notifications.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markAllRead(userId: number) {
    await this.notifications.update({ userId, isRead: false }, { isRead: true });
    return { ok: true };
  }
}
