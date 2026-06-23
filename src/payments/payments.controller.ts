import { Body, Controller, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(@Request() req, @Body('plan') plan: string) {
    return this.paymentsService.createPayment(req.user.id, plan);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('gift')
  async gift(@Request() req, @Body('plan') plan: string, @Body('recipient') recipient: string) {
    return this.paymentsService.createGift(req.user.id, plan, recipient);
  }

  @HttpCode(200)
  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
