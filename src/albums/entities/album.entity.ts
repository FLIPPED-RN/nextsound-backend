import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  cover_path?: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  created_at!: Date;
}
