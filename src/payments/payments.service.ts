import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';

const API = 'https://api.yookassa.ru/v3';
const SITE = (process.env.FRONTEND_URL || 'https://24nextsound.ru').replace(/\/$/, '');

const PLANS: Record<string, { price: number; title: string }> = {
  plus: { price: 99, title: 'Подписка NextSound Plus (30 дней)' },
  artist: { price: 199, title: 'Подписка NextSound Artist (30 дней)' },
  pro: { price: 299, title: 'Подписка NextSound Pro (30 дней)' },
};

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(User) private users: Repository<User>) { }

  private authHeader(): string {
    const id = process.env.YOOKASSA_SHOP_ID || '';
    const key = process.env.YOOKASSA_SECRET_KEY || '';
    return 'Basic ' + Buffer.from(`${id}:${key}`).toString('base64');
  }

  async createPayment(userId: number, planId: string) {
    const plan = PLANS[planId];
    if (!plan) throw new BadRequestException('Неизвестный тариф');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const value = plan.price.toFixed(2);
    const body: any = {
      amount: { value, currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: `${SITE}/premium?paid=1` },
      description: plan.title,
      metadata: { userId: String(userId), planId },
    };

    if (process.env.YOOKASSA_RECEIPT !== 'false') {
      body.receipt = {
        customer: { email: user.email },
        items: [{
          description: plan.title,
          quantity: '1.00',
          amount: { value, currency: 'RUB' },
          vat_code: 1,
          payment_mode: 'full_payment',
          payment_subject: 'service',
        }],
      };
    }

    const res = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader(),
        'Idempotence-Key': randomUUID(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadRequestException(data?.description || 'Не удалось создать платёж');
    }
    return { url: data?.confirmation?.confirmation_url };
  }

  async handleWebhook(payload: any) {
    const paymentId = payload?.object?.id;
    if (!paymentId) return { ok: true };

    const res = await fetch(`${API}/payments/${paymentId}`, {
      headers: { 'Authorization': this.authHeader() },
    });
    if (!res.ok) return { ok: true };
    const p: any = await res.json().catch(() => ({}));

    if (p?.status === 'succeeded' && p?.paid) {
      const userId = Number(p?.metadata?.userId);
      const planId = p?.metadata?.planId;
      if (userId && PLANS[planId]) {
        const user = await this.users.findOne({ where: { id: userId } });
        const now = Date.now();
        const currentEnd = user?.planExpires ? new Date(user.planExpires).getTime() : 0;
        const base = user?.plan === planId && currentEnd > now ? currentEnd : now;
        const expires = new Date(base + 30 * 24 * 60 * 60 * 1000);
        await this.users.update({ id: userId }, { plan: planId, planExpires: expires });
      }
    }
    return { ok: true };
  }
}
