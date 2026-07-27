import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [GatewayModule, OrdersModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
