import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(private readonly config: ConfigService) {
    const port = Number(this.config.get('MAIL_PORT') || 465);
    this.from = this.config.get('MAIL_FROM') || 'NextSound <no-reply@24nextsound.ru>';
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST') || 'smtp.timeweb.ru',
      port,
      secure: port === 465,
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#fff;padding:32px;border-radius:16px;max-width:440px;margin:auto">
        <h1 style="margin:0 0 8px;font-size:22px">NextSound</h1>
        <p style="color:#aaa;margin:0 0 24px">Подтверждение регистрации</p>
        <p style="margin:0 0 12px">Ваш код подтверждения:</p>
        <div style="font-size:34px;font-weight:bold;letter-spacing:10px;background:#151515;padding:16px;border-radius:12px;text-align:center">${code}</div>
        <p style="color:#888;font-size:13px;margin-top:24px">Код действует 15 минут. Если вы не регистрировались — просто проигнорируйте письмо.</p>
      </div>`;
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `NextSound — код подтверждения: ${code}`,
      text: `Ваш код подтверждения NextSound: ${code}. Действует 15 минут.`,
      html,
    });
    this.logger.log(`Verification code sent to ${to}`);
  }
}
