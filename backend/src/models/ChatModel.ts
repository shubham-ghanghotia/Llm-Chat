import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import MonitoringService from '../services/MonitoringService';

export interface CreateChatData {
  title: string;
  userId: string;
  context?: string;
}

export interface ChatWithMessages {
  id: string;
  title: string;
  context?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageData[];
}

export interface MessageData {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: Date;
}

export interface ChatContext {
  messages: MessageData[];
  context?: string;
}

class ChatModel {
  private prisma: PrismaClient;
  private monitoring: MonitoringService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.monitoring = MonitoringService.getInstance();
  }

  // Create a new chat
  public async createChat(data: CreateChatData): Promise<ChatWithMessages> {
    const startTime = Date.now();
    
    try {
      const chat = await this.prisma.chat.create({
        data: {
          title: data.title,
          userId: data.userId,
          context: data.context,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'chats', duration);

      logger.info('Chat created successfully', { chatId: chat.id, userId: data.userId });

      return this.mapToChatWithMessages(chat);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'chats', duration);
      logger.error('Failed to create chat', { error, userId: data.userId });
      throw error;
    }
  }

  // Get chat by ID with messages
  public async getChatById(chatId: string, userId: string): Promise<ChatWithMessages | null> {
    const startTime = Date.now();
    
    try {
      const chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: userId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'chats', duration);

      if (!chat) {
        return null;
      }

      return this.mapToChatWithMessages(chat);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'chats', duration);
      logger.error('Failed to get chat by ID', { error, chatId, userId });
      throw error;
    }
  }

  // Get all chats for a user
  public async getUserChats(userId: string): Promise<ChatWithMessages[]> {
    const startTime = Date.now();
    
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Get only the last message for preview
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('findMany', 'chats', duration);

      return chats.map(chat => this.mapToChatWithMessages(chat));
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('findMany', 'chats', duration);
      logger.error('Failed to get user chats', { error, userId });
      throw error;
    }
  }

  // Add message to chat
  public async addMessage(chatId: string, userId: string, content: string, role: 'USER' | 'ASSISTANT' | 'SYSTEM'): Promise<MessageData> {
    const startTime = Date.now();
    
    try {
      const message = await this.prisma.message.create({
        data: {
          content,
          role,
          chatId,
          userId
        }
      });

      // Update chat's updatedAt timestamp
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'messages', duration);
      this.monitoring.recordChatMessage(role, userId);

      logger.info('Message added successfully', { messageId: message.id, chatId, role });

      return this.mapToMessageData(message);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'messages', duration);
      logger.error('Failed to add message', { error, chatId, userId, role });
      throw error;
    }
  }

  // Update chat title
  public async updateChatTitle(chatId: string, userId: string, title: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.prisma.chat.updateMany({
        where: {
          id: chatId,
          userId: userId
        },
        data: { title }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'chats', duration);

      logger.info('Chat title updated successfully', { chatId, userId, title });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'chats', duration);
      logger.error('Failed to update chat title', { error, chatId, userId });
      throw error;
    }
  }

  // Delete chat and all its messages
  public async deleteChat(chatId: string, userId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.prisma.chat.deleteMany({
        where: {
          id: chatId,
          userId: userId
        }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('delete', 'chats', duration);

      logger.info('Chat deleted successfully', { chatId, userId });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('delete', 'chats', duration);
      logger.error('Failed to delete chat', { error, chatId, userId });
      throw error;
    }
  }

  // Get chat context for AI
  public async getChatContext(chatId: string, userId: string): Promise<ChatContext> {
    const startTime = Date.now();
    
    try {
      const chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: userId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20 // Get last 20 messages for context
          }
        }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'chats', duration);

      if (!chat) {
        throw new Error('Chat not found');
      }

      return {
        messages: chat.messages.map(msg => this.mapToMessageData(msg)),
        context: chat.context || undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'chats', duration);
      logger.error('Failed to get chat context', { error, chatId, userId });
      throw error;
    }
  }

  // Update chat context
  public async updateChatContext(chatId: string, userId: string, context: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.prisma.chat.updateMany({
        where: {
          id: chatId,
          userId: userId
        },
        data: { context }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'chats', duration);

      logger.info('Chat context updated successfully', { chatId, userId });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'chats', duration);
      logger.error('Failed to update chat context', { error, chatId, userId });
      throw error;
    }
  }

  // Get chat statistics
  public async getChatStats(userId: string): Promise<{ total: number; totalMessages: number; averageMessagesPerChat: number }> {
    const startTime = Date.now();
    
    try {
      const [chatCount, messageCount] = await Promise.all([
        this.prisma.chat.count({ where: { userId } }),
        this.prisma.message.count({ where: { userId } })
      ]);

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('count', 'chats', duration);

      return {
        total: chatCount,
        totalMessages: messageCount,
        averageMessagesPerChat: chatCount > 0 ? Math.round(messageCount / chatCount) : 0
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('count', 'chats', duration);
      logger.error('Failed to get chat stats', { error, userId });
      throw error;
    }
  }

  // Private helper methods
  private mapToChatWithMessages(chat: any): ChatWithMessages {
    return {
      id: chat.id,
      title: chat.title,
      context: chat.context,
      userId: chat.userId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map((msg: any) => this.mapToMessageData(msg))
    };
  }

  private mapToMessageData(message: any): MessageData {
    return {
      id: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt
    };
  }
}

export default ChatModel;
