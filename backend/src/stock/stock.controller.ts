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
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantAccessGuard } from '../common/guards/restaurant-access.guard';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import {
  CreateStockEntryDto,
  CreateStockEntryGroupDto,
} from './dto/create-stock-entry.dto';
import { UpdateStockEntryDto } from './dto/update-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { SetIngredientsDto } from './dto/set-ingredients.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class StockController {
  constructor(private service: StockService) {}

  // Itens
  @Post('items')
  createItem(@Body() dto: CreateStockItemDto) {
    return this.service.createItem(dto);
  }

  @Get('items/restaurant/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  findAllItems(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllItems(restaurantId);
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.service.findOneItem(id);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateStockItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id);
  }

  // Entradas
  @Post('entries')
  createEntry(@Body() dto: CreateStockEntryDto | CreateStockEntryGroupDto) {
    if ('items' in dto && Array.isArray(dto.items)) {
      return this.service.createEntryGroup(dto);
    }
    return this.service.createEntry(dto as CreateStockEntryDto);
  }

  @Get('entries/restaurant/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  findEntries(@Param('restaurantId') restaurantId: string) {
    return this.service.findEntries(restaurantId);
  }

  @Patch('entries/:id')
  updateEntry(@Param('id') id: string, @Body() dto: UpdateStockEntryDto) {
    return this.service.updateEntry(id, dto);
  }

  @Delete('entries/:id')
  removeEntry(@Param('id') id: string) {
    return this.service.removeEntry(id);
  }

  // Saídas
  @Post('exits')
  createExit(@Body() dto: CreateStockExitDto) {
    return this.service.createExit(dto);
  }

  @Get('exits/restaurant/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  findExits(@Param('restaurantId') restaurantId: string) {
    return this.service.findExits(restaurantId);
  }

  // Receitas
  @Post('recipes/:menuItemId')
  setIngredients(
    @Param('menuItemId') menuItemId: string,
    @Body() dto: SetIngredientsDto,
  ) {
    return this.service.setIngredients(menuItemId, dto.ingredients);
  }

  @Get('recipes/:menuItemId')
  getIngredients(@Param('menuItemId') menuItemId: string) {
    return this.service.getIngredients(menuItemId);
  }

  // Relatórios
  @Get('report/stock/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  getStockReport(@Param('restaurantId') restaurantId: string) {
    return this.service.getStockReport(restaurantId);
  }

  @Get('report/profit/:restaurantId')
  @UseGuards(RestaurantAccessGuard)
  getProfitReport(@Param('restaurantId') restaurantId: string) {
    return this.service.getProfitReport(restaurantId);
  }
}
