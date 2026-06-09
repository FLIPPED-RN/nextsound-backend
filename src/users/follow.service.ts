import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow) private follows: Repository<Follow>,
    private notifications: NotificationsService,
  ) { }

  async toggle(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('Нельзя подписаться на себя');
    }
    const existing = await this.follows.findOne({ where: { followerId, followingId } });
    if (existing) {
      await this.follows.remove(existing);
      return { following: false };
    }
    await this.follows.save(this.follows.create({ followerId, followingId }));
    await this.notifications.notify(followingId, 'follow', { actorId: followerId });
    return { following: true };
  }

  async info(userId: number, currentUserId?: number) {
    const followers = await this.follows.count({ where: { followingId: userId } });
    const following = await this.follows.count({ where: { followerId: userId } });
    let isFollowing = false;
    if (currentUserId) {
      isFollowing = !!(await this.follows.findOne({ where: { followerId: currentUserId, followingId: userId } }));
    }
    return { followers, following, isFollowing };
  }
}
