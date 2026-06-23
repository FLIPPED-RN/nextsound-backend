import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { ACHIEVEMENTS } from './achievements.def';
import { effectivePlan } from '../common/plans';

function levelInfo(xp: number) {
  let level = 1, need = 100, rem = xp;
  while (rem >= need && level < 999) { rem -= need; level++; need = Math.round(need * 1.35); }
  return { level, intoLevel: rem, nextLevelXp: need, pct: need ? Math.round((rem / need) * 100) : 0 };
}

function computeXp(m: Record<string, number>, achievements: number, streak: number, subscriber: boolean) {
  let xp = m.listened * 5 + m.likes * 3 + m.comments * 8 + m.uploads * 40 + m.plays * 1
    + m.followers * 20 + m.reposts * 10 + m.albums * 60 + achievements * 50 + streak * 15;
  if (subscriber) xp *= 2;
  return Math.round(xp);
}

const dayGap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

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
    const userRows = await this.dataSource.query('SELECT plan, planExpires, streakCount FROM user WHERE id=?', [userId]);
    const subscriber = effectivePlan(userRows?.[0]) !== 'free' ? 1 : 0;
    const streak = Number(userRows?.[0]?.streakCount || 0);
    return { listened, likes, uploads, plays, albums, followers, comments, playlists, reposts, subscriber, streak };
  }

  private progressFrom(m: Record<string, number>, unlockedCount: number) {
    const subscriber = m.subscriber === 1;
    const xp = computeXp(m, unlockedCount, m.streak, subscriber);
    return { xp, ...levelInfo(xp), streak: m.streak, subscriber };
  }

  async ping(userId: number) {
    const rows = await this.dataSource.query('SELECT plan, planExpires, streakCount, lastActiveDate FROM user WHERE id=?', [userId]);
    const row = rows?.[0];
    if (!row) return { streak: 0 };
    const sub = effectivePlan(row) !== 'free';
    const today = new Date().toISOString().slice(0, 10);
    let streak = Number(row.streakCount || 0);
    const last: string | null = row.lastActiveDate;
    if (!last) {
      streak = 1;
    } else {
      const gap = dayGap(last, today);
      if (gap <= 0) { /* уже сегодня */ }
      else if (gap === 1) streak += 1;
      else if (gap === 2 && sub) streak += 1; // заморозка стрика для Premium
      else streak = 1;
    }
    await this.dataSource.query('UPDATE user SET streakCount=?, lastActiveDate=? WHERE id=?', [streak, today, userId]);
    return { streak };
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

    const unlockedTotal = list.filter((a) => a.unlocked).length;
    return {
      achievements: list,
      unlockedCount: unlockedTotal,
      total: list.length,
      newly: list.filter((a) => a.unlockedNow),
      progress: this.progressFrom(m, unlockedTotal),
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
    const m: Record<string, number> = await this.metrics(userId);
    return {
      achievements: list,
      unlockedCount: ownedSet.size,
      total: list.length,
      progress: this.progressFrom(m, ownedSet.size),
    };
  }
}
