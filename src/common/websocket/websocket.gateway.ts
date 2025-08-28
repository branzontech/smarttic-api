import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', 
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // ¡Agrega este método!
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string): void {
    client.join(roomId);
    console.log(`Cliente ${client.id} se ha unido a la sala ${roomId}`);
  }
  
  // ¡Agrega este método!
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string): void {
    client.leave(roomId);
    console.log(`Cliente ${client.id} ha salido de la sala ${roomId}`);
  }

  emitEvent(event: string, data: any, roomId?: string) {
    if (roomId) {
      this.server.to(roomId).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }
}