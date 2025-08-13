import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import MonitoringService from '../services/MonitoringService';
import ChatModel, { CreateChatData } from '../models/ChatModel';

class ChatController {
  private chatModel: ChatModel;
  private monitoring: MonitoringService;

  constructor(chatModel: ChatModel) {
    this.chatModel = chatModel;
    this.monitoring = MonitoringService.getInstance();
  }

  // Create a new chat
  public async createChat(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { title, context }: CreateChatData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!title || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Chat title is required'
        });
        return;
      }

      const chat = await this.chatModel.createChat({
        title: title.trim(),
        userId,
        context
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 201, duration);

      res.status(201).json({
        success: true,
        message: 'Chat created successfully',
        data: { chat }
      });

      logger.info('Chat created successfully', { chatId: chat.id, userId });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'create_chat_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to create chat', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all chats for a user
  public async getUserChats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const chats = await this.chatModel.getUserChats(userId);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        data: { chats }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'get_chats_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to get user chats', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get a specific chat with messages
  public async getChat(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: 'Chat ID is required'
        });
        return;
      }

      const chat = await this.chatModel.getChatById(chatId, userId);

      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
        return;
      }

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        data: { chat }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'get_chat_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to get chat', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update chat title
  public async updateChatTitle(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { chatId } = req.params;
      const { title } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!chatId || !title || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Chat ID and title are required'
        });
        return;
      }

      await this.chatModel.updateChatTitle(chatId, userId, title.trim());

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        message: 'Chat title updated successfully'
      });

      logger.info('Chat title updated successfully', { chatId, userId });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'update_chat_title_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to update chat title', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete chat
  public async deleteChat(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: 'Chat ID is required'
        });
        return;
      }

      await this.chatModel.deleteChat(chatId, userId);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        message: 'Chat deleted successfully'
      });

      logger.info('Chat deleted successfully', { chatId, userId });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'delete_chat_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to delete chat', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get chat statistics
  public async getChatStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const stats = await this.chatModel.getChatStats(userId);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'get_chat_stats_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to get chat stats', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add message to chat
  public async addMessage(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { chatId } = req.params;
      const { content, role } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!chatId || !content || !role) {
        res.status(400).json({
          success: false,
          message: 'Chat ID, content, and role are required'
        });
        return;
      }

      if (!['USER', 'ASSISTANT', 'SYSTEM'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be USER, ASSISTANT, or SYSTEM'
        });
        return;
      }

      const message = await this.chatModel.addMessage(chatId, userId, content, role);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 201, duration);

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: { message }
      });

      logger.info('Message added successfully', { messageId: message.id, chatId, role });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'add_message_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Failed to add message', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default ChatController;
