import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(user: CreateUserDto): Promise<User> {
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

  async updateMe(id: number, data: Partial<Pick<User, 'firstName' | 'lastName' | 'nickname' | 'bio'>>) {
    const clean: Partial<User> = {};
    if (data.firstName !== undefined) clean.firstName = data.firstName;
    if (data.lastName !== undefined) clean.lastName = data.lastName;
    if (data.nickname !== undefined) clean.nickname = data.nickname;
    if (data.bio !== undefined) clean.bio = data.bio;
    await this.usersRepository.update({ id }, clean);
    return this.getPublicProfile(id);
  }

  async setAvatar(id: number, avatarPath: string) {
    await this.usersRepository.update({ id }, { avatar: avatarPath });
    return this.getPublicProfile(id);
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
