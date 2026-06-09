import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  actor!: User;

  @Column()
  actorId!: number;

  @Column('varchar')
  type!: string;

  @Column({ type: 'int', nullable: true })
  trackId?: number | null;

  @Column({ type: 'int', nullable: true })
  commentId?: number | null;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
