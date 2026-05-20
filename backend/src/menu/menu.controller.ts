import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private menuService: MenuService) {}

  // ── Categorias ────────────────────────────────────────────────

  @Post('categories')
  @Roles('MANAGER')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories/restaurant/:restaurantId')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER', 'GUEST')
  findCategories(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findCategoriesByRestaurant(restaurantId);
  }

  @Delete('categories/:id')
  @Roles('MANAGER')
  removeCategory(@Param('id') id: string) {
    return this.menuService.removeCategory(id);
  }

  // ── Itens ─────────────────────────────────────────────────────

  @Post('items')
  @Roles('MANAGER')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items/restaurant/:restaurantId')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER', 'GUEST')
  findAllItems(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findAllItems(restaurantId);
  }

  @Get('items/:id')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER', 'GUEST')
  findOneItem(@Param('id') id: string) {
    return this.menuService.findOneItem(id);
  }

  @Patch('items/:id')
  @Roles('MANAGER')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Patch('items/:id/toggle')
  @Roles('MANAGER')
  toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleAvailability(id);
  }

  @Delete('items/:id')
  @Roles('MANAGER')
  removeItem(@Param('id') id: string) {
    return this.menuService.removeItem(id);
  }
}
