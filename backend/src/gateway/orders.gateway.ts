import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

type SocketUser = {
  sub?: string;
  role?: string;
  restaurantId?: string;
};

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private jwt: JwtService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (typeof token !== 'string') {
      client.disconnect(true);
      return;
    }

    try {
      const user = this.jwt.verify<SocketUser>(token);
      client.data.user = user;
      if (user.sub) {
        void client.join(`guest_${user.sub}`);
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    void client.id;
  }

  // Cliente entra na sala da sessão da mesa
  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) return;
    void client.join(`session_${sessionId}`);
  }

  // Cliente entra na sala do restaurante (gestor, cozinha, bar)
  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(
    @MessageBody() restaurantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as SocketUser | undefined;
    const role = user?.role?.toUpperCase();
    if (
      !user ||
      role === 'GUEST' ||
      (user.restaurantId && user.restaurantId !== restaurantId)
    ) {
      return;
    }

    void client.join(`restaurant_${restaurantId}`);
  }

  // Notifica novo pedido para o restaurante
  notifyNewOrder(restaurantId: string, order: any, sessionId?: string) {
    this.server.to(`restaurant_${restaurantId}`).emit('new_order', order);
    if (sessionId) {
      this.server.to(`session_${sessionId}`).emit('new_order', order);
    }
  }

  // Notifica atualização de status para a sessão e o restaurante
  notifyOrderStatusUpdate(restaurantId: string, sessionId: string, order: any) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .to(`session_${sessionId}`)
      .emit('order_status_updated', order);
  }

  // Notifica chamada de garçom
  notifyWaiterCall(restaurantId: string, data: any) {
    this.server.to(`restaurant_${restaurantId}`).emit('waiter_called', data);
  }

  // Notifica pedido de conta
  notifyBillRequest(restaurantId: string, sessionId: string, data: any) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .to(`session_${sessionId}`)
      .emit('bill_requested', data);
  }

  // Notifica mudanca na ocupacao/status de mesas
  notifyTableSessionUpdate(restaurantId: string, data: any) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .emit('table_session_updated', data);
  }

  // ── Autorização de acesso à mesa ──────────────────────────────────────────

  // Notifica o dono da sessão que alguém quer entrar
  // O frontend do dono ouve 'table_access_requested'
  notifyAccessRequest(
    sessionId: string,
    data: {
      requestId: string;
      guestId: string;
      guestName: string;
      tableNumber: number;
      ownerId: string;
    },
  ) {
    this.server
      .to(`session_${sessionId}`)
      .to(`guest_${data.ownerId}`)
      .emit('table_access_requested', data);
  }

  // Notifica o solicitante sobre a decisão do dono
  // O frontend do solicitante ouve 'table_access_response'
  notifyAccessResponse(
    sessionId: string,
    data: {
      requestId: string;
      approved: boolean;
      guestId: string;
    },
  ) {
    this.server
      .to(`session_${sessionId}`)
      .to(`guest_${data.guestId}`)
      .emit('table_access_response', data);
  }
}
