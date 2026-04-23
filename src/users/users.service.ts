import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../auth/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    firstName: string,
    lastName: string,
    nickname: string,
    email: string,
    password: string,
  ) {
    const user = this.usersRepository.create({
      firstName,
      lastName,
      nickname,
      email,
      password: password,
      role: Role.Listener,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    const savedUser = await this.usersRepository.save(user);
    return savedUser;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async update(id: number, email: string): Promise<void> {
    await this.usersRepository.update({ id }, { email });
  }
}
