import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantAccessGuard } from '../common/guards/restaurant-access.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class SuppliersController {
  constructor(private service: SuppliersService) {}

  @Post()
  create(@Body() body: CreateSupplierDto) {
    return this.service.create(body);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSupplierDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
