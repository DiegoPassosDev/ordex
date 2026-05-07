import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // ── Categorias ────────────────────────────────────────────────

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories/restaurant/:restaurantId')
  findCategories(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findCategoriesByRestaurant(restaurantId);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.menuService.removeCategory(id);
  }

  // ── Itens ─────────────────────────────────────────────────────

  @Post('items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items/restaurant/:restaurantId')
  findAllItems(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findAllItems(restaurantId);
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.menuService.findOneItem(id);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Patch('items/:id/toggle')
  toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleAvailability(id);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.menuService.removeItem(id);
  }
}