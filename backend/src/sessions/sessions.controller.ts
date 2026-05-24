import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { AssignWaiterDto } from './dto/assign-waiter.dto';
import { RequestBillDto } from './dto/request-bill.dto';
import { RequestTableAccessDto } from './dto/request-table-access.dto';
import { RespondTableAccessDto } from './dto/respond-table-access.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @Roles('GUEST', 'WAITER', 'MANAGER')
  open(@Body() dto: OpenSessionDto) {
    return this.sessionsService.open(dto);
  }

  @Get('restaurant/:restaurantId/active')
  @Roles('MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  findActive(@Param('restaurantId') restaurantId: string) {
    return this.sessionsService.findActiveByRestaurant(restaurantId);
  }

  @Get('table/:tableId/active')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'CASHIER')
  findActiveByTable(
    @Param('tableId') tableId: string,
    @Query('guestId') guestId?: string,
  ) {
    return this.sessionsService.findActiveByTable(tableId, guestId);
  }

  @Get(':id')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get(':id/access-requests/pending')
  getPendingAccessRequests(@Param('id') id: string) {
    return this.sessionsService.getPendingAccessRequests(id);
  }

  @Patch(':id/assign-waiter')
  @Roles('MANAGER', 'WAITER')
  assignWaiter(@Param('id') id: string, @Body() dto: AssignWaiterDto) {
    return this.sessionsService.assignWaiter(id, dto);
  }

  @Patch(':id/request-bill')
  @Roles('GUEST', 'WAITER', 'MANAGER')
  requestBill(@Param('id') id: string, @Body() dto: RequestBillDto) {
    return this.sessionsService.requestBill(id, dto);
  }

  @Patch(':id/close')
  @Roles('MANAGER', 'CASHIER', 'WAITER')
  close(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.close(id, req.user?.role);
  }

  @Post(':id/call-waiter')
  @Roles('GUEST')
  callWaiter(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.sessionsService.callWaiter(id, body.reason);
  }

  @Post(':id/leave')
  @Roles('GUEST')
  leaveSession(@Param('id') id: string, @Body() body: { guestId: string }) {
    return this.sessionsService.leaveSession(id, body.guestId);
  }

  @Get(':id/total')
  @Roles('GUEST', 'MANAGER', 'WAITER', 'CASHIER')
  getTotal(@Param('id') id: string) {
    return this.sessionsService.getSessionTotal(id);
  }

  @Post(':id/request-access')
  @Roles('GUEST')
  requestAccess(@Param('id') id: string, @Body() dto: RequestTableAccessDto) {
    return this.sessionsService.requestAccess(id, dto);
  }

  @Patch('access/:requestId/respond')
  @Roles('GUEST', 'WAITER', 'MANAGER')
  respondAccess(
    @Param('requestId') requestId: string,
    @Body() dto: RespondTableAccessDto,
    @Req() req: any,
  ) {
    return this.sessionsService.respondAccess(requestId, dto.approved, req.user.id);
  }
}
