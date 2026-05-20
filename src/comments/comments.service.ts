import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(
    userId: number,
    trackId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = this.commentsRepository.create({ ...dto, userId, trackId });
    return this.commentsRepository.save(comment);
  }

  async findByTrack(trackId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { trackId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Комментарий не найден');
    if (comment.userId !== userId)
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    await this.commentsRepository.delete(id);
  }
}
