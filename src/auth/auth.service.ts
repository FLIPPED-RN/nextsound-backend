import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from './role.enum';
import { MailService } from '../mail/mail.service';

const CODE_TTL = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  private genCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email)
    if (!user) {
      throw new NotFoundException('Пользователь не найден, проверьте введенные данные')
    }

    const match = await this.usersService.comparePassword(pass, user.password)
    if (!match) {
      throw new UnauthorizedException('Неверный пароль')
    }

    const { password, verifyCode, verifyExpires, ...result } = user as any
    return result
  }

  async login(user) {
    const token = await this.generateToken(user)
    return { user, token }
  }

  private mailEnabled() {
    return process.env.MAIL_ENABLED === 'true';
  }

  async create(user) {
    const existUser = await this.usersService.findOneByEmail(user.email)
    if (existUser) {
      throw new ConflictException('Пользователь с таким Email уже существует')
    }

    const pass = await this.usersService.hashPassword(user.password)
    const newUser = await this.usersService.create({ ...user, password: pass, role: Role.Listener })

    if (!this.mailEnabled()) {
      await this.usersService.markVerified(newUser.id)
      return { needVerification: false, email: newUser.email }
    }

    const code = this.genCode()
    await this.usersService.setVerifyCode(newUser.id, code, Date.now() + CODE_TTL)
    await this.mailService.sendVerificationCode(newUser.email, code)

    return { needVerification: true, email: newUser.email }
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findOneByEmail(email)
    if (!user) throw new NotFoundException('Пользователь не найден')

    if (user.isVerified) {
      const { password, verifyCode, verifyExpires, ...clean } = user as any
      return { user: clean, token: await this.generateToken(clean) }
    }

    if (!user.verifyCode || String(user.verifyCode) !== String(code).trim()) {
      throw new BadRequestException('Неверный код')
    }
    if (!user.verifyExpires || Number(user.verifyExpires) < Date.now()) {
      throw new BadRequestException('Срок действия кода истёк, запросите новый')
    }

    await this.usersService.markVerified(user.id)
    const { password, verifyCode, verifyExpires, ...clean } = user as any
    clean.isVerified = true
    return { user: clean, token: await this.generateToken(clean) }
  }

  async resend(email: string) {
    const user = await this.usersService.findOneByEmail(email)
    if (!user) throw new NotFoundException('Пользователь не найден')
    if (user.isVerified) return { alreadyVerified: true }

    const code = this.genCode()
    await this.usersService.setVerifyCode(user.id, code, Date.now() + CODE_TTL)
    await this.mailService.sendVerificationCode(user.email, code)
    return { sent: true }
  }

  private async generateToken(user) {
    const token = await this.jwtService.signAsync(user)
    return token
  }
}
