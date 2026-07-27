import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { PrintersModule } from '../printers/printers.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [GatewayModule, PrintersModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
