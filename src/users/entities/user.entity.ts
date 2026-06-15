import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
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
  @Exclude()
  password!: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: false })
  isArtistVerified!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  @Exclude()
  verifyCode?: string | null;

  @Column({ type: 'bigint', nullable: true })
  @Exclude()
  verifyExpires?: number | null;

  @Column({ type: 'enum', enum: Role, default: Role.Listener })
  role!: Role;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
