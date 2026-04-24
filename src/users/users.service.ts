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
    return await this.usersRepository.create(user)
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email }
    })
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id }
    })
  }

  async profile(id: number): Promise<User> {
    const user = await this.findOneById(id);
    return this.userResponse(user)
  }

  async updateProfile(id: number, firstName: string, lastName: string, nickname: string): Promise<void> {
    const user = await this.findOneById(id)
    await this.usersRepository.update({ id }, {
      firstName, lastName, nickname
    })
  }

  async changePasswod(id: number, oldPassword: string, newPassword: string) {
    const user = await this.findOneById(id)
    const match = await this.comparePassword(oldPassword, user?.password)
    if (!match) {
      throw new ForbiddenException(
        'Старый пароль, не верный'
      )
    }

    const password = await this.hashPassword(newPassword)
    await this.usersRepository.update({ id }, { password })
  }

  userResponse(user) {
    const { password, ...result } = user['dataValues'];
    return result;
  }

  async hashPassword(password) {
    const hash = await bcrypt.hash(password, 10)
    return hash;
  }

  async comparePassword(enteredPassword, dbPassword) {
    const match = await bcrypt.compare(enteredPassword, dbPassword)
    return match;
  }
}
