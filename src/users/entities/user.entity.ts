import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../auth/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  firstName!: string;

  @Column('text')
  lastName!: string;

  @Column('text')
  nickname?: string;

  @Column('text')
  email!: string;

  @Column('text')
  password!: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  verifyCode?: string | null;

  @Column({ type: 'bigint', nullable: true })
  verifyExpires?: number | null;

  @Column({ type: 'enum', enum: Role, default: Role.Listener })
  role!: Role;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
