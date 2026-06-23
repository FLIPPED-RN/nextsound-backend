import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { effectivePlan } from '../common/plans';

@Injectable()
export class StatsService {
  constructor(private ds: DataSource) { }

  private async count(sql: string, params: any[]) {
    const rows = await this.ds.query(sql, params);
    return Number(rows?.[0]?.c || 0);
  }

  async forArtist(userId: number) {
    const planRow = (await this.ds.query('SELECT plan, planExpires FROM user WHERE id=?', [userId]))?.[0];
    const subscriber = effectivePlan(planRow) !== 'free';

    const [totalPlays, trackCount, uniqueListeners, followers, likes, comments, reposts] = await Promise.all([
      this.count('SELECT COALESCE(SUM(plays_count),0) c FROM track WHERE userId=?', [userId]),
      this.count('SELECT COUNT(*) c FROM track WHERE userId=?', [userId]),
      this.count('SELECT COUNT(DISTINCT p.userId) c FROM play p JOIN track t ON p.trackId=t.id WHERE t.userId=?', [userId]),
      this.count('SELECT COUNT(*) c FROM follow WHERE followingId=?', [userId]),
      this.count('SELECT COUNT(*) c FROM `like` l JOIN track t ON l.trackId=t.id WHERE t.userId=?', [userId]),
      this.count('SELECT COUNT(*) c FROM comment cm JOIN track t ON cm.trackId=t.id WHERE t.userId=?', [userId]),
      this.count('SELECT COUNT(*) c FROM repost r JOIN track t ON r.trackId=t.id WHERE t.userId=?', [userId]),
    ]);

    const topTracks = await this.ds.query(
      'SELECT id, title, cover_path, plays_count FROM track WHERE userId=? ORDER BY plays_count DESC LIMIT 6',
      [userId],
    );

    let playsByDay: { date: string; count: number }[] | null = null;
    let recentListeners: any[] | null = null;

    if (subscriber) {
      const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
      const rows = await this.ds.query(
        "SELECT DATE_FORMAT(p.created_at,'%Y-%m-%d') d, COUNT(*) c FROM play p JOIN track t ON p.trackId=t.id WHERE t.userId=? AND p.created_at >= ? GROUP BY d",
        [userId, since],
      );
      const map = new Map<string, number>(rows.map((r: any) => [r.d, Number(r.c)]));
      playsByDay = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        playsByDay.push({ date: d, count: map.get(d) || 0 });
      }

      const lr = await this.ds.query(
        'SELECT u.id, u.nickname, u.firstName, u.avatar, MAX(p.created_at) last FROM play p JOIN track t ON p.trackId=t.id JOIN user u ON p.userId=u.id WHERE t.userId=? AND p.userId<>? GROUP BY u.id, u.nickname, u.firstName, u.avatar ORDER BY last DESC LIMIT 12',
        [userId, userId],
      );
      recentListeners = lr.map((u: any) => ({ id: u.id, nickname: u.nickname, firstName: u.firstName, avatar: u.avatar }));
    }

    return {
      subscriber,
      summary: { totalPlays, trackCount, uniqueListeners, followers, likes, comments, reposts },
      topTracks,
      playsByDay,
      recentListeners,
    };
  }
}
