import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RestaurantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const restaurantId = request.params.restaurantId;

    if (!user?.restaurantId) return true;
    if (!restaurantId) return true;

    if (user.restaurantId !== restaurantId) {
      throw new ForbiddenException('Acesso negado a este restaurante.');
    }
    return true;
  }
}
