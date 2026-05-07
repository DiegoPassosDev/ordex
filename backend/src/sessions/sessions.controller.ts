import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { AssignWaiterDto } from './dto/assign-waiter.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  open(@Body() dto: OpenSessionDto) {
    return this.sessionsService.open(dto);
  }

  @Get('restaurant/:restaurantId/active')
  findActive(@Param('restaurantId') restaurantId: string) {
    return this.sessionsService.findActiveByRestaurant(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id/assign-waiter')
  assignWaiter(@Param('id') id: string, @Body() dto: AssignWaiterDto) {
    return this.sessionsService.assignWaiter(id, dto);
  }

  @Patch(':id/request-bill')
  requestBill(@Param('id') id: string) {
    return this.sessionsService.requestBill(id);
  }

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.sessionsService.close(id);
  }

  @Post(':id/call-waiter')
  callWaiter(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.sessionsService.callWaiter(id, body.reason);
  }

  @Get(':id/total')
  getTotal(@Param('id') id: string) {
    return this.sessionsService.getSessionTotal(id);
  }
}