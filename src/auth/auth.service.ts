import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  public async register(dto: RegisterDto) {
    const isExists = await this.usersService.findByEmail(dto.email);

    if (isExists) {
      throw new ConflictException(
        'Увы, но пользователь с таким email уже существует',
      );
    }

    // const newUser = await this.usersService.create
  }
}
