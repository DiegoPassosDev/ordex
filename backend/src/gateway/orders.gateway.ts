import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
})
export class OrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Cliente entra na sala da sessão da mesa
  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`session_${sessionId}`);
    console.log(`Cliente ${client.id} entrou na sessão ${sessionId}`);
  }

  // Cliente entra na sala do restaurante (gestor, cozinha, bar)
  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(
    @MessageBody() restaurantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`restaurant_${restaurantId}`);
    console.log(`Cliente ${client.id} entrou no restaurante ${restaurantId}`);
  }

  // Notifica novo pedido para o restaurante
  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant_${restaurantId}`).emit('new_order', order);
  }

  // Notifica atualização de status para a sessão e o restaurante
  notifyOrderStatusUpdate(
    restaurantId: string,
    sessionId: string,
    order: any,
  ) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .to(`session_${sessionId}`)
      .emit('order_status_updated', order);
  }

  // Notifica chamada de garçom
  notifyWaiterCall(restaurantId: string, data: any) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .emit('waiter_called', data);
  }

  // Notifica pedido de conta
  notifyBillRequest(restaurantId: string, sessionId: string, data: any) {
    this.server
      .to(`restaurant_${restaurantId}`)
      .to(`session_${sessionId}`)
      .emit('bill_requested', data);
  }
}