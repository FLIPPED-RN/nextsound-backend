import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from './role.enum';

@Injectable()
export class AuthService {
  constructor(
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
      throw new UnauthorizedException('Неверный пароль')
    }

    const { password, ...result } = user
    return result
  }

  async login(user) {
    const token = await this.generateToken(user)
    return { user, token }
  }

  async create(user) {
    const existUser = await this.usersService.findOneByEmail(user.email)
    if (existUser) {
      throw new ConflictException('Паользователь с таким Email уже существует')
    }

    const pass = await this.usersService.hashPassword(user.password)

    const newUser = await this.usersService.create({ ...user, password: pass, role: Role.Listener })

    const { password, ...result } = newUser

    const token = await this.generateToken(result)

    return { user: result, token }
  }

  private async generateToken(user) {
    const token = await this.jwtService.signAsync(user)
    return token
  }
}
