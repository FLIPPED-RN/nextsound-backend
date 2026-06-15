import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Track } from '../../tracks/entities/track.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  text!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Track)
  track!: Track;

  @Column()
  trackId!: number;

  @Column({ type: 'int', nullable: true })
  parentId?: number | null;

  @Column({ type: 'float', nullable: true })
  timestamp?: number | null;

  @CreateDateColumn()
  created_at!: Date;
}
