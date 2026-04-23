import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersService: UsersService,
  ) {}

  public async register(dto: RegisterDto) {
    const isExists = await this.usersService.findByEmail(dto.email);

    if (isExists) {
      throw new ConflictException(
        'Увы, но пользователь с таким email уже существует',
      );
    }
  }
}
