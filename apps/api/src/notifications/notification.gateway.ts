/**
 * RECOMMENDATION: Real-time Notifications
 * WebSocket gateway for live load updates, alerts, and messages
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Send notification to all users in a company
  sendToCompany(companyId: string, notification: NotificationPayload) {
    this.server.to(`company:${companyId}`).emit('notification', notification);
  }

  // Send load status update
  sendLoadUpdate(loadId: string, update: LoadUpdatePayload) {
    this.server.to(`load:${loadId}`).emit('load:update', update);
  }

  // Send exception alert
  sendExceptionAlert(companyId: string, alert: ExceptionAlertPayload) {
    this.server.to(`company:${companyId}`).emit('exception:alert', alert);
  }

  // Join company room
  @SubscribeMessage('join:company')
  handleJoinCompany(client: Socket, companyId: string) {
    client.join(`company:${companyId}`);
  }

  // Join load room
  @SubscribeMessage('join:load')
  handleJoinLoad(client: Socket, loadId: string) {
    client.join(`load:${loadId}`);
  }

  // Mark notification as read
  @SubscribeMessage('notification:read')
  handleMarkRead(client: Socket, notificationId: string) {
    // Update in database
    client.emit('notification:read:confirmed', notificationId);
  }
}

interface NotificationPayload {
  id: string;
  type: 'load_update' | 'exception' | 'message' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

interface LoadUpdatePayload {
  loadId: string;
  status: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  updatedBy: string;
}

interface ExceptionAlertPayload {
  loadId: string;
  type: 'delay' | 'deviation' | 'breakdown' | 'hos_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
  timestamp: string;
}
