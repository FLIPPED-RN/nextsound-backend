import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  trackId!: number;

  @Column()
  userId!: number;

  @Column('text')
  reason!: string;

  @CreateDateColumn()
  created_at!: Date;
}
