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
import { PrintersService } from './printers.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { AddPrinterRuleDto } from './dto/add-printer-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantAccessGuard } from '../common/guards/restaurant-access.guard';

@Controller('printers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class PrintersController {
  constructor(private service: PrintersService) {}

  @Post()
  create(@Body() body: CreatePrinterDto) {
    return this.service.create(body);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllIncludingInactive(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePrinterDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/rules')
  addRule(@Param('id') id: string, @Body() body: AddPrinterRuleDto) {
    return this.service.addRule(id, body.categoryType);
  }

  @Delete(':id/rules/:ruleId')
  removeRule(@Param('ruleId') ruleId: string) {
    return this.service.removeRule(ruleId);
  }
}
