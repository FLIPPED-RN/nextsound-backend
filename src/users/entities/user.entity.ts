import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  fullName!: string;

  @Column('text')
  nickname?: string;

  @Column('text')
  email!: string;

  @Column('text')
  password_hash!: string;

  @Column('text')
  role!: string;

  @Column('date')
  created_at!: Date;

  @Column('date')
  updated_at!: Date;
}
