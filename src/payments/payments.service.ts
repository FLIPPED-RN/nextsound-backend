import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

const API = 'https://api.yookassa.ru/v3';
const SITE = (process.env.FRONTEND_URL || 'https://24nextsound.ru').replace(/\/$/, '');

const PLANS: Record<string, { price: number; title: string }> = {
  plus: { price: 199, title: 'Подписка NextSound Plus (30 дней)' },
  artist: { price: 399, title: 'Подписка NextSound Artist (30 дней)' },
  pro: { price: 599, title: 'Подписка NextSound Pro (30 дней)' },
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private notifications: NotificationsService,
  ) { }

  private authHeader(): string {
    const id = process.env.YOOKASSA_SHOP_ID || '';
    const key = process.env.YOOKASSA_SECRET_KEY || '';
    return 'Basic ' + Buffer.from(`${id}:${key}`).toString('base64');
  }

  private async submit(value: string, title: string, payerEmail: string | undefined, returnUrl: string, metadata: any) {
    const body: any = {
      amount: { value, currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: returnUrl },
      description: title,
      metadata,
    };
    if (process.env.YOOKASSA_RECEIPT !== 'false') {
      body.receipt = {
        customer: { email: payerEmail },
        items: [{
          description: title, quantity: '1.00',
          amount: { value, currency: 'RUB' },
          vat_code: 1, payment_mode: 'full_payment', payment_subject: 'service',
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
    if (!res.ok) throw new BadRequestException(data?.description || 'Не удалось создать платёж');
    return { url: data?.confirmation?.confirmation_url };
  }

  private async resolveUser(identifier: string) {
    const id = (identifier || '').trim().replace(/^@/, '');
    if (!id) return null;
    if (id.includes('@')) return this.users.findOne({ where: { email: id } });
    return this.users.findOne({ where: { nickname: id } });
  }

  async createPayment(userId: number, planId: string) {
    const plan = PLANS[planId];
    if (!plan) throw new BadRequestException('Неизвестный тариф');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.submit(plan.price.toFixed(2), plan.title, user.email, `${SITE}/premium?paid=1`,
      { userId: String(userId), planId });
  }

  async createGift(buyerId: number, planId: string, recipient: string) {
    const plan = PLANS[planId];
    if (!plan) throw new BadRequestException('Неизвестный тариф');
    const buyer = await this.users.findOne({ where: { id: buyerId } });
    const rec = await this.resolveUser(recipient);
    if (!rec) throw new BadRequestException('Получатель не найден — проверь e-mail или ник');
    if (rec.id === buyerId) throw new BadRequestException('Нельзя подарить подписку себе');
    return this.submit(plan.price.toFixed(2), `Подарок: ${plan.title}`, buyer?.email, `${SITE}/premium?gift=1`,
      { type: 'gift', planId, recipientId: String(rec.id), buyerId: String(buyerId) });
  }

  async handleWebhook(payload: any) {
    const paymentId = payload?.object?.id;
    if (!paymentId) return { ok: true };

    const res = await fetch(`${API}/payments/${paymentId}`, { headers: { 'Authorization': this.authHeader() } });
    if (!res.ok) return { ok: true };
    const p: any = await res.json().catch(() => ({}));

    if (p?.status === 'succeeded' && p?.paid) {
      const meta = p?.metadata || {};
      const planId = meta.planId;
      const isGift = meta.type === 'gift';
      const targetId = Number(isGift ? meta.recipientId : meta.userId);

      if (targetId && PLANS[planId]) {
        const user = await this.users.findOne({ where: { id: targetId } });
        const now = Date.now();
        const currentEnd = user?.planExpires ? new Date(user.planExpires).getTime() : 0;
        const base = user?.plan === planId && currentEnd > now ? currentEnd : now;
        const expires = new Date(base + 30 * 24 * 60 * 60 * 1000);
        await this.users.update({ id: targetId }, { plan: planId, planExpires: expires });

        if (isGift) {
          const buyerId = Number(meta.buyerId);
          await this.notifications.notify(targetId, 'gift', { actorId: buyerId });
        }
      }
    }
    return { ok: true };
  }
}
