import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private service: StockService) {}

  // Itens
  @Post('items')
  createItem(@Body() body: any) {
    return this.service.createItem(body);
  }

  @Get('items/restaurant/:restaurantId')
  findAllItems(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllItems(restaurantId);
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.service.findOneItem(id);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.service.updateItem(id, body);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id);
  }

  // Entradas
  @Post('entries')
  createEntry(@Body() body: any) {
    return this.service.createEntry(body);
  }

  @Get('entries/restaurant/:restaurantId')
  findEntries(@Param('restaurantId') restaurantId: string) {
    return this.service.findEntries(restaurantId);
  }

  // Saídas
  @Post('exits')
  createExit(@Body() body: any) {
    return this.service.createExit(body);
  }

  @Get('exits/restaurant/:restaurantId')
  findExits(@Param('restaurantId') restaurantId: string) {
    return this.service.findExits(restaurantId);
  }

  // Receitas
  @Post('recipes/:menuItemId')
  setIngredients(
    @Param('menuItemId') menuItemId: string,
    @Body() body: { ingredients: any[] },
  ) {
    return this.service.setIngredients(menuItemId, body.ingredients);
  }

  @Get('recipes/:menuItemId')
  getIngredients(@Param('menuItemId') menuItemId: string) {
    return this.service.getIngredients(menuItemId);
  }

  // Relatórios
  @Get('report/stock/:restaurantId')
  getStockReport(@Param('restaurantId') restaurantId: string) {
    return this.service.getStockReport(restaurantId);
  }

  @Get('report/profit/:restaurantId')
  getProfitReport(@Param('restaurantId') restaurantId: string) {
    return this.service.getProfitReport(restaurantId);
  }
}
