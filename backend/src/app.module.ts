import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { TablesModule } from './tables/tables.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { GatewayModule } from './gateway/gateway.module';
import { SessionsModule } from './sessions/sessions.module';
import { EmployeesModule } from './employees/employees.module';
import { GuestsModule } from './guests/guests.module';
import { StockModule } from './stock/stock.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RestaurantModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    GatewayModule,
    SessionsModule,
    EmployeesModule,
    GuestsModule,
    StockModule,
    SuppliersModule,
    PurchaseOrdersModule,
    PaymentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
