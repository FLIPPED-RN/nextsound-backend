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
  banner?: string;

  @Column({ type: 'text', nullable: true })
  links?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  themeColor?: string | null;

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

  @Column({ type: 'varchar', length: 16, default: 'free' })
  plan!: string;

  @Column({ type: 'datetime', nullable: true })
  planExpires?: Date | null;

  @Column({ type: 'int', nullable: true })
  referredBy?: number | null;

  @Column({ default: false })
  referralRewarded!: boolean;

  @Column({ default: 0 })
  streakCount!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  lastActiveDate?: string | null;

  @Column({ default: false })
  consentPrivacy!: boolean;

  @Column({ default: false })
  consentTerms!: boolean;

  @Column({ default: false })
  consentMarketing!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  consentDocVersion?: string | null;

  @Column({ type: 'datetime', nullable: true })
  consentAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  consentIp?: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
