import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuestsController {
  constructor(private guestsService: GuestsService) {}

  @Get(':id')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }
}
