import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
  ) { }

  async toggleLike(userId: number, trackId: number): Promise<{ liked: boolean }> {
    const existing = await this.likesRepository.findOne({ where: { userId, trackId } });
    if (existing) {
      await this.likesRepository.remove(existing);
      return { liked: false };
    }
    const like = this.likesRepository.create({ userId, trackId });
    await this.likesRepository.save(like);
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