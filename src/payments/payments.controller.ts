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

  @HttpCode(200)
  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
