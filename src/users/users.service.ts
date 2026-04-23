import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../auth/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(
    firstName: string,
    lastName: string,
    nickname: string,
    email: string,
    password: string,
  ) {
    const user = await this.usersRepository.create({
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

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOneBy({ id })

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден в системе'
      )
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async update(userId: number, dto: UpdateUserDto): Promise<void> {
    const user = await this.findById(userId)

    const updatedUser = await this.usersRepository.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      nickname: dto.nickname,
      email: dto.email
    })
  }
}
