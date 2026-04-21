import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column()
  nickname?: string;

  @Column()
  email!: string;

  @Column()
  password_hash!: string;

  @Column()
  role!: string;

  @Column()
  created_at!: Date;

  @Column()
  updated_at!: Date;
}
