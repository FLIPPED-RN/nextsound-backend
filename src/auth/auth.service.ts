import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { verify } from 'argon2';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email)
    if (!user) {
      throw new NotFoundException('Пользователь не найден, проверьте введенные данные')
    }

    const match = await this.usersService.comparePassword(pass, user.password)
    if (!match) {
      return null // дописать логику ошибки!!!
    }

    const { password, ...result } = user['dataValues']
    return result
  }

  async login(user) {
    const token = await this.generagteToken(user)
    return { user, token }
  }
}
