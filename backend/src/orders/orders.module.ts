import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { GatewayModule } from 'src/gateway/gateway.module';
import { StockModule } from 'src/stock/stock.module';
import { PrintersModule } from 'src/printers/printers.module';

@Module({
  imports: [GatewayModule, StockModule, PrintersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
