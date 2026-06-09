import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, Column } from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  follower!: User;

  @Column()
  followerId!: number;

  @ManyToOne(() => User)
  following!: User;

  @Column()
  followingId!: number;

  @CreateDateColumn()
  created_at!: Date;
}
