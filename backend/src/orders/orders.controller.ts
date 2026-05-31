import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantAccessGuard } from '../common/guards/restaurant-access.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles('GUEST', 'WAITER', 'MANAGER')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('session/:sessionId')
  @Roles('GUEST', 'WAITER', 'MANAGER', 'CASHIER')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.findBySession(sessionId);
  }

  @Get('restaurant/:restaurantId')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  @UseGuards(RestaurantAccessGuard)
  findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    return this.ordersService.findByRestaurant(restaurantId, date);
  }

  @Get(':id')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':orderId/items/:itemId/status')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR')
  updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemStatusDto,
  ) {
    return this.ordersService.updateItemStatus(orderId, itemId, dto);
  }

  @Delete(':id/cancel')
  @Roles('GUEST', 'MANAGER', 'WAITER')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }
}
