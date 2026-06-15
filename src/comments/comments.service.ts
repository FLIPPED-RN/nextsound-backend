import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Track } from '../tracks/entities/track.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private commentLikes: Repository<CommentLike>,
    @InjectRepository(Track)
    private tracks: Repository<Track>,
    private notifications: NotificationsService,
  ) { }

  async create(
    userId: number,
    trackId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentsRepository.save(
      this.commentsRepository.create({
        text: dto.text,
        userId,
        trackId,
        parentId: dto.parentId ?? null,
        timestamp: dto.parentId ? null : (dto.timestamp ?? null),
      }),
    );

    const track = await this.tracks.findOne({ where: { id: trackId } });
    if (track) {
      await this.notifications.notify(track.userId, 'comment', { actorId: userId, trackId, commentId: comment.id });
    }
    if (dto.parentId) {
      const parent = await this.commentsRepository.findOne({ where: { id: dto.parentId } });
      if (parent) {
        await this.notifications.notify(parent.userId, 'reply', { actorId: userId, trackId, commentId: comment.id });
      }
    }
    return comment;
  }

  async findByTrack(trackId: number, currentUserId?: number): Promise<any[]> {
    const comments = await this.commentsRepository.find({
      where: { trackId },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
    if (!comments.length) return [];

    const ids = comments.map((c) => c.id);
    const likeRows = await this.commentLikes
      .createQueryBuilder('cl')
      .select('cl.commentId', 'commentId')
      .addSelect('COUNT(*)', 'cnt')
      .where('cl.commentId IN (:...ids)', { ids })
      .groupBy('cl.commentId')
      .getRawMany();
    const countMap = new Map(likeRows.map((r) => [Number(r.commentId), Number(r.cnt)]));

    let mine = new Set<number>();
    if (currentUserId) {
      const my = await this.commentLikes.find({ where: { userId: currentUserId, commentId: In(ids) } });
      mine = new Set(my.map((m) => m.commentId));
    }

    return comments.map((c) => {
      const { password, verifyCode, verifyExpires, ...user } = (c.user || {}) as any;
      return { ...c, user, likesCount: countMap.get(c.id) || 0, likedByMe: mine.has(c.id) };
    });
  }

  async toggleLike(userId: number, commentId: number) {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Комментарий не найден');
    const existing = await this.commentLikes.findOne({ where: { userId, commentId } });
    if (existing) {
      await this.commentLikes.remove(existing);
      return { liked: false };
    }
    await this.commentLikes.save(this.commentLikes.create({ userId, commentId }));
    await this.notifications.notify(comment.userId, 'comment_like', {
      actorId: userId,
      trackId: comment.trackId,
      commentId,
    });
    return { liked: true };
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Комментарий не найден');
    if (comment.userId !== userId)
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    await this.commentLikes.delete({ commentId: id });
    await this.commentsRepository.delete({ parentId: id });
    await this.commentsRepository.delete(id);
  }
}
