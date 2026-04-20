import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket): void {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected to chat`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(client: Socket, threadId: string): Promise<void> {
    client.join(`thread:${threadId}`);
    const messages = await this.chatService.getThreadMessages(threadId);
    client.emit('thread_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    client: Socket,
    payload: {
      threadId: string;
      content: string;
      type?: string;
      mediaUrl?: string;
      replyTo?: string;
      mentions?: string[];
    },
  ): Promise<void> {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string || 'Unknown';
    const userRole = client.handshake.auth.role as any || 'dispatcher';

    const message = await this.chatService.sendMessage(
      payload.threadId,
      userId,
      userName,
      userRole,
      payload.content,
      (payload.type as any) || 'text',
      {
        mediaUrl: payload.mediaUrl,
        replyTo: payload.replyTo,
        mentions: payload.mentions,
      },
    );

    // Broadcast to all participants in the thread
    this.server.to(`thread:${payload.threadId}`).emit('new_message', message);

    // Send unread notification to offline participants
    const thread = (await this.chatService.getUserThreads(userId)).find(t => t.id === payload.threadId);
    if (thread) {
      for (const participant of thread.participants) {
        if (participant !== userId) {
          const unread = await this.chatService.getUnreadCount(participant);
          this.server.to(`user:${participant}`).emit('unread_count', { threadId: payload.threadId, count: unread });
        }
      }
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { threadId: string; isTyping: boolean }): Promise<void> {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string;

    client.to(`thread:${payload.threadId}`).emit('user_typing', {
      userId,
      userName,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(client: Socket, threadId: string): Promise<void> {
    const userId = client.handshake.auth.userId as string;
    await this.chatService.markAsRead(threadId, userId);
  }

  @SubscribeMessage('voice_note')
  async handleVoiceNote(
    client: Socket,
    payload: { threadId: string; audioUrl: string; duration: number },
  ): Promise<void> {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string || 'Unknown';

    const message = await this.chatService.sendMessage(
      payload.threadId, userId, userName, 'driver',
      `Voice note (${payload.duration}s)`, 'voice',
      { mediaUrl: payload.audioUrl },
    );

    this.server.to(`thread:${payload.threadId}`).emit('new_message', message);
  }

  // Server-side method to notify a driver about backhaul options
  async notifyDriver(driverId: string, title: string, body: string, data?: any): Promise<void> {
    this.server.to(`user:${driverId}`).emit('notification', { title, body, data });
  }
}
