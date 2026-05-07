import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';

@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get('restaurant/:restaurantId')
  findAllByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.tablesService.findAllByRestaurant(restaurantId);
  }

  @Get('qr/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.tablesService.findByQrCode(qrCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}