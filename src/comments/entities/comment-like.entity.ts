import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

@Entity()
@Unique(['userId', 'commentId'])
export class CommentLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Comment)
  comment!: Comment;

  @Column()
  commentId!: number;

  @CreateDateColumn()
  created_at!: Date;
}
