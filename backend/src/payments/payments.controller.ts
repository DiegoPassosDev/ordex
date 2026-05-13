import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.createPayment(body);
  }

  @Get('session/:sessionId/bill')
  getSessionBill(@Param('sessionId') sessionId: string) {
    return this.service.getSessionBill(sessionId);
  }

  @Get('restaurant/:restaurantId/pending')
  getPending(@Param('restaurantId') restaurantId: string) {
    return this.service.getPendingSessions(restaurantId);
  }

  @Get('restaurant/:restaurantId/report')
  getReport(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    return this.service.getCashierReport(restaurantId, date);
  }

  @Get('restaurant/:restaurantId/debts')
  getDebts(@Param('restaurantId') restaurantId: string) {
    return this.service.getDebts(restaurantId);
  }

  @Post('debts/:debtId/pay')
  payDebt(
    @Param('debtId') debtId: string,
    @Body() body: { amount: number; authorizedBy: string },
  ) {
    return this.service.payDebt(debtId, body.amount, body.authorizedBy);
  }
}
