import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Track } from '../tracks/entities/track.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
    private notifications: NotificationsService,
  ) { }

  async toggleLike(userId: number, trackId: number): Promise<{ liked: boolean }> {
    const existing = await this.likesRepository.findOne({ where: { userId, trackId } });
    if (existing) {
      await this.likesRepository.remove(existing);
      return { liked: false };
    }
    const like = this.likesRepository.create({ userId, trackId });
    await this.likesRepository.save(like);
    const track = await this.tracksRepository.findOne({ where: { id: trackId } });
    if (track) {
      await this.notifications.notify(track.userId, 'track_like', { actorId: userId, trackId });
    }
    return { liked: true };
  }

  async getLikesCount(trackId: number): Promise<number> {
    return this.likesRepository.count({ where: { trackId } });
  }

  async isLiked(userId: number, trackId: number): Promise<boolean> {
    const like = await this.likesRepository.findOne({ where: { userId, trackId } });
    return !!like;
  }

  async getUserLikedTracks(userId: number): Promise<Like[]> {
    return this.likesRepository.find({ where: { userId }, relations: ['track', 'track.user'] });
  }
}
