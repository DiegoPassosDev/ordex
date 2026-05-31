import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantAccessGuard } from '../common/guards/restaurant-access.guard';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Post()
  @Roles('MANAGER')
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get('restaurant/:restaurantId')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  @UseGuards(RestaurantAccessGuard)
  findAllByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('available') available?: string,
  ) {
    return this.tablesService.findAllByRestaurant(
      restaurantId,
      available === 'true',
    );
  }

  @Get('qr/:qrCode')
  @Roles('GUEST', 'MANAGER', 'WAITER')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.tablesService.findByQrCode(qrCode);
  }

  @Get(':id')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Delete(':id')
  @Roles('MANAGER')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
