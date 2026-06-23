import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private s3: S3Service,
  ) { }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(user);
    return await this.usersRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async profile(id: number): Promise<User> {
    const user = await this.findOneById(id);
    return this.userResponse(user);
  }

  async updateMe(id: number, data: Partial<Pick<User, 'firstName' | 'lastName' | 'nickname' | 'bio' | 'links'>>) {
    const clean: Partial<User> = {};
    if (data.firstName !== undefined) clean.firstName = data.firstName;
    if (data.lastName !== undefined) clean.lastName = data.lastName;
    if (data.nickname !== undefined) clean.nickname = data.nickname;
    if (data.bio !== undefined) clean.bio = data.bio;
    if (data.links !== undefined) clean.links = data.links;
    await this.usersRepository.update({ id }, clean);
    return this.getPublicProfile(id);
  }

  async setAvatar(id: number, avatarPath: string) {
    await this.usersRepository.update({ id }, { avatar: avatarPath });
    return this.getPublicProfile(id);
  }

  async uploadAvatar(id: number, file?: Express.Multer.File) {
    if (!file) return this.getPublicProfile(id);
    const current = await this.findOneById(id);
    if (current?.avatar) await this.s3.deleteByUrl(current.avatar);
    const url = await this.s3.uploadFile(file, 'avatars');
    return this.setAvatar(id, url);
  }

  async uploadBanner(id: number, file?: Express.Multer.File) {
    if (!file) return this.getPublicProfile(id);
    const current = await this.findOneById(id);
    if (current?.banner) await this.s3.deleteByUrl(current.banner);
    const url = await this.s3.uploadFile(file, 'banners');
    await this.usersRepository.update({ id }, { banner: url });
    return this.getPublicProfile(id);
  }

  async setVerifyCode(id: number, code: string, expires: number) {
    await this.usersRepository.update({ id }, { verifyCode: code, verifyExpires: expires });
  }

  async grantBonusDays(userId: number, days: number, minPlan = 'plus') {
    const u = await this.findOneById(userId);
    if (!u) return;
    const now = Date.now();
    const curEnd = u.planExpires ? new Date(u.planExpires).getTime() : 0;
    const base = curEnd > now ? curEnd : now;
    const expires = new Date(base + days * 86400000);
    const plan = u.plan && u.plan !== 'free' ? u.plan : minPlan;
    await this.usersRepository.update({ id: userId }, { plan, planExpires: expires });
  }

  async setReferredBy(userId: number, refId: number) {
    await this.usersRepository.update({ id: userId }, { referredBy: refId });
  }

  async markReferralRewarded(userId: number) {
    await this.usersRepository.update({ id: userId }, { referralRewarded: true });
  }

  async markVerified(id: number) {
    await this.usersRepository.update({ id }, { isVerified: true, verifyCode: null, verifyExpires: null });
  }

  async changePasswod(id: number, oldPassword: string, newPassword: string) {
    const user = await this.findOneById(id);
    const match = await this.comparePassword(oldPassword, user?.password);
    if (!match) {
      throw new ForbiddenException('Старый пароль, не верный');
    }
    const password = await this.hashPassword(newPassword);
    await this.usersRepository.update({ id }, { password });
  }

  userResponse(user) {
    const { password, ...result } = user;
    return result;
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(enteredPassword, dbPassword) {
    return await bcrypt.compare(enteredPassword, dbPassword);
  }

  async getPublicProfile(id: number) {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    const { password, ...result } = user;
    return result;
  }
}
