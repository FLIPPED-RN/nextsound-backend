import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { ACHIEVEMENTS } from './achievements.def';
import { effectivePlan } from '../common/plans';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(UserAchievement) private ua: Repository<UserAchievement>,
    private dataSource: DataSource,
  ) { }

  private async metrics(userId: number) {
    const q = async (sql: string) => {
      const rows = await this.dataSource.query(sql, [userId]);
      return Number(rows?.[0]?.c || 0);
    };
    const [listened, likes, uploads, plays, albums, followers, comments, playlists, reposts] = await Promise.all([
      q('SELECT COUNT(*) c FROM play WHERE userId=?'),
      q('SELECT COUNT(*) c FROM `like` WHERE userId=?'),
      q('SELECT COUNT(*) c FROM track WHERE userId=?'),
      q('SELECT COALESCE(SUM(plays_count),0) c FROM track WHERE userId=?'),
      q('SELECT COUNT(*) c FROM album WHERE userId=?'),
      q('SELECT COUNT(*) c FROM follow WHERE followingId=?'),
      q('SELECT COUNT(*) c FROM comment WHERE userId=?'),
      q('SELECT COUNT(*) c FROM playlist WHERE userId=?'),
      q('SELECT COUNT(*) c FROM repost WHERE userId=?'),
    ]);
    const userRows = await this.dataSource.query('SELECT plan, planExpires FROM user WHERE id=?', [userId]);
    const subscriber = effectivePlan(userRows?.[0]) !== 'free' ? 1 : 0;
    return { listened, likes, uploads, plays, albums, followers, comments, playlists, reposts, subscriber };
  }

  async getForUser(userId: number, sync = true) {
    const m: Record<string, number> = await this.metrics(userId);

    const owned = await this.ua.find({ where: { userId } });
    const ownedSet = new Set(owned.map((o) => o.achievementId));

    // first pass: everything except the meta "collector"
    const evaluated = ACHIEVEMENTS.map((a) => {
      const current = a.metric === 'unlocked' ? 0 : (m[a.metric] ?? 0);
      const unlocked = a.metric === 'unlocked' ? false : current >= a.target;
      return { def: a, current, unlocked };
    });

    const baseUnlockedCount = evaluated.filter((e) => e.def.metric !== 'unlocked' && e.unlocked).length;
    // resolve collector
    for (const e of evaluated) {
      if (e.def.metric === 'unlocked') {
        e.current = baseUnlockedCount;
        e.unlocked = baseUnlockedCount >= e.def.target;
      }
    }

    const newlyUnlocked: string[] = [];
    if (sync) {
      const toInsert = evaluated.filter((e) => e.unlocked && !ownedSet.has(e.def.id));
      for (const e of toInsert) {
        try {
          await this.ua.save(this.ua.create({ userId, achievementId: e.def.id }));
          ownedSet.add(e.def.id);
          newlyUnlocked.push(e.def.id);
        } catch { /* unique race — ignore */ }
      }
    }

    const list = evaluated.map((e) => ({
      id: e.def.id,
      title: e.def.title,
      desc: e.def.desc,
      emoji: e.def.emoji,
      category: e.def.category,
      premium: !!e.def.premium,
      target: e.def.target,
      current: Math.min(e.current, e.def.target),
      unlocked: sync ? ownedSet.has(e.def.id) : ownedSet.has(e.def.id),
      unlockedNow: newlyUnlocked.includes(e.def.id),
    }));

    return {
      achievements: list,
      unlockedCount: list.filter((a) => a.unlocked).length,
      total: list.length,
      newly: list.filter((a) => a.unlockedNow),
    };
  }

  async getPublic(userId: number) {
    const owned = await this.ua.find({ where: { userId } });
    const ownedSet = new Set(owned.map((o) => o.achievementId));
    const list = ACHIEVEMENTS.map((a) => ({
      id: a.id, title: a.title, desc: a.desc, emoji: a.emoji,
      category: a.category, premium: !!a.premium, target: a.target,
      current: 0, unlocked: ownedSet.has(a.id), unlockedNow: false,
    }));
    return { achievements: list, unlockedCount: ownedSet.size, total: list.length };
  }
}
