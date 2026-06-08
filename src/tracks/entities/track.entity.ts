import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TrackVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  LINK = 'link',
}

@Entity()
export class Track {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  genre?: string;

  @Column({ type: 'int', nullable: true })
  bpm?: number;

  @Column()
  file_path!: string;

  @Column({ nullable: true })
  cover_path?: string;

  @Column({ type: 'enum', enum: TrackVisibility, default: TrackVisibility.PUBLIC })
  visibility!: TrackVisibility;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  release_date!: Date;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  userId!: number;

  @Column({ default: 0 })
  plays_count!: number;

  @Column({ type: 'bigint', default: 0 })
  size!: number;

  @Column({ default: false })
  isFeatured!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}