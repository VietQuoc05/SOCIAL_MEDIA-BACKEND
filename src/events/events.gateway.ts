import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('✅ Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected:', client.id);
  }

  emitPostCreated(data: any) {
    this.server.emit('post_created', data);
  }

  emitPostDeleted(postId: string) {
    this.server.emit('post_deleted', { postId });
  }

  emitNewComment(data: any) {
    this.server.emit('new_comment', data);
  }

  emitReactionUpdate(data: any) {
    this.server.emit('reaction_update', data);
  }
}
