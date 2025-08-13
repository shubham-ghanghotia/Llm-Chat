import { Server, Socket } from 'socket.io';
import { Ollama } from '@langchain/community/llms/ollama';
import { logger } from '../../utils/logger';
import MonitoringService from '../../services/MonitoringService';
import ChatModel from '../../models/ChatModel';
import { verifyToken } from '../../middleware/auth';

interface ChatMessage {
  content: string;
  chatId: string;
  userId: string;
  context?: string;
}

interface SocketWithUser extends Socket {
  user?: {
    id: string;
    email?: string;
  };
}

class ChatSocketHandler {
  private io: Server;
  private chatModel: ChatModel;
  private monitoring: MonitoringService;
  private model: Ollama;

  constructor(io: Server, chatModel: ChatModel) {
    this.io = io;
    this.chatModel = chatModel;
    this.monitoring = MonitoringService.getInstance();
    
    // Initialize Ollama model
    this.model = new Ollama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'gemma3:4b',
      temperature: 0.7,
    });

    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: SocketWithUser) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: SocketWithUser): Promise<void> {
    try {
      // Authenticate socket connection
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        logger.warn('Socket connection without token', { socketId: socket.id });
        socket.emit('auth_error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        logger.warn('Invalid token in socket connection', { socketId: socket.id });
        socket.emit('auth_error', { message: 'Invalid token' });
        socket.disconnect();
        return;
      }

      socket.user = {
        id: decoded.id,
        email: decoded.email
      };

      this.monitoring.incrementActiveConnections();
      
      logger.info('Socket connected', { 
        socketId: socket.id, 
        userId: socket.user.id,
        totalConnections: this.io.engine.clientsCount 
      });

      // Handle chat with LLM
      socket.on('chat-with-llm', async (data: ChatMessage) => {
        await this.handleChatWithLLM(socket, data);
      });

      // Handle chat management
      socket.on('create-chat', async (data: { title: string; context?: string }) => {
        await this.handleCreateChat(socket, data);
      });

      socket.on('get-user-chats', async () => {
        await this.handleGetUserChats(socket);
      });

      socket.on('delete-chat', async (data: { chatId: string }) => {
        await this.handleDeleteChat(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

    } catch (error) {
      logger.error('Socket connection error', { error, socketId: socket.id });
      socket.emit('error', { message: 'Connection error' });
      socket.disconnect();
    }
  }

  private async handleChatWithLLM(socket: SocketWithUser, data: ChatMessage): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!data.content) {
        socket.emit('error', { message: 'Content is required' });
        return;
      }

      let chatId = data.chatId;
      
      // If no chatId provided or chat doesn't exist, create a new chat
      if (!chatId) {
        const newChat = await this.chatModel.createChat({
          userId: socket.user.id,
          title: 'New Chat'
        });
        chatId = newChat.id;
        // Emit the new chat ID to the client
        socket.emit('chat-created', { chatId: newChat.id, chat: newChat });
      } else {
        // Verify the chat exists and belongs to the user
        const existingChat = await this.chatModel.getChatById(chatId, socket.user.id);
        if (!existingChat) {
          // Create a new chat if the provided one doesn't exist
          const newChat = await this.chatModel.createChat({
            userId: socket.user.id,
            title: 'New Chat'
          });
          chatId = newChat.id;
          socket.emit('chat-created', { chatId: newChat.id, chat: newChat });
        }
      }

      logger.info('Processing LLM request', { 
        userId: socket.user.id, 
        chatId: chatId,
        contentLength: data.content.length 
      });

      // Add user message to database
      const userMessage = await this.chatModel.addMessage(
        chatId,
        socket.user.id,
        data.content,
        'USER'
      );

      // Emit typing indicator
      socket.emit('llm-typing-start');

      // Get chat context
      const chatContext = await this.chatModel.getChatContext(chatId, socket.user.id);
      
      // Build context prompt
      const contextPrompt = this.buildContextPrompt(chatContext, data.context);
      const fullPrompt = `${contextPrompt}\n\nUser: ${data.content}\n\nAssistant:`;

      // Get AI response
      const aiResponse = await this.model.stream(fullPrompt);
      
      let responseContent = '';
      for await (const chunk of aiResponse) {
        responseContent += chunk;
        socket.emit('llm-response-chunk', { chunk });
      }

      // Add AI response to database
      const aiMessage = await this.chatModel.addMessage(
        chatId,
        socket.user.id,
        responseContent,
        'ASSISTANT'
      );

      // Emit complete response
      socket.emit('llm-typing-end');
      socket.emit('llm-response-complete', { 
        message: aiMessage,
        chatId: chatId 
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordAIResponseTime(process.env.OLLAMA_MODEL || 'gemma3:4b', duration);

      logger.info('LLM response completed', { 
        userId: socket.user.id, 
        chatId: data.chatId,
        responseLength: responseContent.length,
        duration 
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordAIResponseTime(process.env.OLLAMA_MODEL || 'gemma3:4b', duration);

      logger.error('LLM request failed', { 
        error: error.message, 
        userId: socket.user?.id,
        chatId: data.chatId || 'unknown' 
      });

      socket.emit('llm-typing-end');
      socket.emit('llm-response-error', { 
        message: 'Failed to get AI response. Please try again.',
        error: error.message 
      });
    }
  }

  private async handleCreateChat(socket: SocketWithUser, data: { title: string; context?: string }): Promise<void> {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const chat = await this.chatModel.createChat({
        title: data.title,
        userId: socket.user.id,
        context: data.context
      });

      socket.emit('chat-created', { chat });
      
      logger.info('Chat created via socket', { 
        userId: socket.user.id, 
        chatId: chat.id 
      });

    } catch (error: any) {
      logger.error('Failed to create chat via socket', { 
        error: error.message, 
        userId: socket.user?.id 
      });
      socket.emit('error', { message: 'Failed to create chat' });
    }
  }

  private async handleGetUserChats(socket: SocketWithUser): Promise<void> {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const chats = await this.chatModel.getUserChats(socket.user.id);
      socket.emit('user-chats', { chats });

    } catch (error: any) {
      logger.error('Failed to get user chats via socket', { 
        error: error.message, 
        userId: socket.user?.id 
      });
      socket.emit('error', { message: 'Failed to get chats' });
    }
  }

  private async handleDeleteChat(socket: SocketWithUser, data: { chatId: string }): Promise<void> {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      await this.chatModel.deleteChat(data.chatId, socket.user.id);
      socket.emit('chat-deleted', { chatId: data.chatId });

      logger.info('Chat deleted via socket', { 
        userId: socket.user.id, 
        chatId: data.chatId 
      });

    } catch (error: any) {
      logger.error('Failed to delete chat via socket', { 
        error: error.message, 
        userId: socket.user?.id,
        chatId: data.chatId 
      });
      socket.emit('error', { message: 'Failed to delete chat' });
    }
  }

  private handleDisconnection(socket: SocketWithUser): void {
    this.monitoring.decrementActiveConnections();
    
    logger.info('Socket disconnected', { 
      socketId: socket.id, 
      userId: socket.user?.id,
      totalConnections: this.io.engine.clientsCount 
    });
  }

  private buildContextPrompt(chatContext: any, additionalContext?: string): string {
    let contextPrompt = 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.';

    if (additionalContext) {
      contextPrompt += `\n\nAdditional context: ${additionalContext}`;
    }

    if (chatContext.context) {
      contextPrompt += `\n\nChat context: ${chatContext.context}`;
    }

    if (chatContext.messages && chatContext.messages.length > 0) {
      contextPrompt += '\n\nPrevious conversation:\n';
      chatContext.messages.forEach((msg: any) => {
        const role = msg.role === 'USER' ? 'User' : 'Assistant';
        contextPrompt += `${role}: ${msg.content}\n`;
      });
    }

    return contextPrompt;
  }

  // Public method to get connection count
  public getConnectionCount(): number {
    return this.io.engine.clientsCount;
  }

  // Public method to broadcast to all connected clients
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}

export default ChatSocketHandler;
