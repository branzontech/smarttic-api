import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Emite un evento a través del WebSocket.
   * @param event El nombre del evento a emitir.
   * @param data Los datos a enviar.
   * @param roomId (Opcional) La sala a la que se enviará el evento.
   */
  emit(event: string, data?: any, roomId?: string) {
    this.websocketGateway.emitEvent(event, data, roomId);
  }
}