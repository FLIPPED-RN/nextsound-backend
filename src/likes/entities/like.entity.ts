import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Track } from '../../tracks/entities/track.entity';

@Entity()
@Unique(['user', 'track'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Track)
  track!: Track;

  @Column()
  trackId!: number;

  @CreateDateColumn()
  created_at!: Date;
}