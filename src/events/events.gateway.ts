import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

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

  handleConnection(client: AuthenticatedSocket) {
    console.log('✅ Client connected:', client.id);
  }

  handleDisconnect(client: AuthenticatedSocket) {
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

  // ============================
  // ✅ CHAT
  // ============================
  emitNewMessage(data: any) {
    // Emit to both participants
    this.server.emit('new_message', data);
  }

  emitConversationCreated(data: any) {
    this.server.emit('conversation_created', data);
  }

  emitConversationUpdated(data: any) {
    this.server.emit('conversation_updated', data);
  }

  emitMessagesRead(data: { conversationId: string; userId: string; readAt: string }) {
    this.server.emit('messages_read', data);
  }

  // ============================
  // ✅ TYPING
  // ============================
  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { conversationId: string; userId: string; displayName: string }) {
    // Broadcast typing event to everyone except the sender
    client.broadcast.emit('typing', data);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(client: Socket, data: { conversationId: string }) {
    client.broadcast.emit('stop_typing', data);
  }
}