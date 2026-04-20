import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export type MessageType = 'text' | 'image' | 'voice' | 'document' | 'location' | 'system';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'dispatcher' | 'driver' | 'broker' | 'system';
  type: MessageType;
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  mentions?: string[];
  replyTo?: string;
  readBy: string[];
  createdAt: Date;
}

export interface ChatThread {
  id: string;
  type: 'load' | 'direct' | 'group';
  title: string;
  loadId?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private threads: Map<string, ChatThread> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();

  constructor(private readonly redis: RedisService) {}

  async createThread(type: ChatThread['type'], title: string, participants: string[], loadId?: string): Promise<ChatThread> {
    const id = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const thread: ChatThread = {
      id,
      type,
      title,
      loadId,
      participants,
      unreadCount: 0,
      pinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.threads.set(id, thread);
    this.messages.set(id, []);
    this.logger.log(`Thread created: ${title} (${participants.length} participants)`);
    return thread;
  }

  async createLoadThread(loadId: string, loadReference: string, participants: string[]): Promise<ChatThread> {
    return this.createThread('load', `Load: ${loadReference}`, participants, loadId);
  }

  async sendMessage(threadId: string, senderId: string, senderName: string, senderRole: ChatMessage['senderRole'], content: string, type: MessageType = 'text', options?: { mediaUrl?: string; replyTo?: string; mentions?: string[] }): Promise<ChatMessage> {
    const thread = this.threads.get(threadId);
    if (!thread) throw new Error('Thread not found');

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      senderId,
      senderName,
      senderRole,
      type,
      content,
      mediaUrl: options?.mediaUrl,
      replyTo: options?.replyTo,
      mentions: options?.mentions,
      readBy: [senderId],
      createdAt: new Date(),
    };

    const threadMessages = this.messages.get(threadId) || [];
    threadMessages.push(message);
    this.messages.set(threadId, threadMessages);

    thread.lastMessage = message;
    thread.updatedAt = new Date();
    thread.unreadCount = threadMessages.filter(m => !m.readBy.includes(senderId) && m.senderId !== senderId).length;

    // Publish to Redis for WebSocket broadcast
    await this.redis.set(`chat:last:${threadId}`, message, 86400);

    this.logger.log(`Message sent in thread ${threadId} by ${senderName}`);
    return message;
  }

  async getThreadMessages(threadId: string, before?: Date, limit: number = 50): Promise<ChatMessage[]> {
    const msgs = this.messages.get(threadId) || [];
    let result = msgs;

    if (before) {
      result = result.filter(m => m.createdAt < before);
    }

    return result.slice(-limit).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getUserThreads(userId: string): Promise<ChatThread[]> {
    const userThreads = Array.from(this.threads.values())
      .filter(t => t.participants.includes(userId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Calculate unread for this user
    for (const thread of userThreads) {
      const msgs = this.messages.get(thread.id) || [];
      thread.unreadCount = msgs.filter(m => !m.readBy.includes(userId) && m.senderId !== userId).length;
    }

    return userThreads;
  }

  async markAsRead(threadId: string, userId: string): Promise<void> {
    const msgs = this.messages.get(threadId) || [];
    for (const msg of msgs) {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
      }
    }
  }

  async searchMessages(userId: string, query: string): Promise<Array<{ message: ChatMessage; thread: ChatThread }>> {
    const results: Array<{ message: ChatMessage; thread: ChatThread }> = [];
    const userThreads = await this.getUserThreads(userId);

    for (const thread of userThreads) {
      const msgs = this.messages.get(thread.id) || [];
      for (const msg of msgs) {
        if (msg.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ message: msg, thread });
        }
      }
    }

    return results.sort((a, b) => b.message.createdAt.getTime() - a.message.createdAt.getTime()).slice(0, 20);
  }

  async addParticipant(threadId: string, userId: string): Promise<void> {
    const thread = this.threads.get(threadId);
    if (!thread) return;
    if (!thread.participants.includes(userId)) {
      thread.participants.push(userId);
    }
  }

  async pinThread(threadId: string, pinned: boolean): Promise<void> {
    const thread = this.threads.get(threadId);
    if (thread) thread.pinned = pinned;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const threads = await this.getUserThreads(userId);
    return threads.reduce((sum, t) => sum + t.unreadCount, 0);
  }
}
