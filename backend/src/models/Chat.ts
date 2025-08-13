export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  userId: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: string; // Additional context for the AI
}

// In-memory chat storage (replace with database in production)
const chats: Map<string, Chat> = new Map();

export class ChatModel {
  static async createChat(userId: string, title: string, context?: string): Promise<Chat> {
    const chat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context
    };

    chats.set(chat.id, chat);
    return chat;
  }

  static async getChatById(chatId: string, userId: string): Promise<Chat | null> {
    const chat = chats.get(chatId);
    
    if (!chat || chat.userId !== userId) {
      return null;
    }

    return chat;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    return Array.from(chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  static async addMessage(chatId: string, userId: string, role: ChatMessage['role'], content: string): Promise<ChatMessage | null> {
    const chat = await this.getChatById(chatId, userId);
    
    if (!chat) {
      return null;
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      userId
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    chats.set(chat.id, chat);

    return message;
  }

  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<boolean> {
    const chat = await this.getChatById(chatId, userId);
    
    if (!chat) {
      return false;
    }

    chat.title = title;
    chat.updatedAt = new Date();
    chats.set(chat.id, chat);

    return true;
  }

  static async deleteChat(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.getChatById(chatId, userId);
    
    if (!chat) {
      return false;
    }

    chats.delete(chatId);
    return true;
  }

  static async getChatContext(chatId: string, userId: string): Promise<string> {
    const chat = await this.getChatById(chatId, userId);
    
    if (!chat) {
      return '';
    }

    // Build context from chat history and custom context
    let context = chat.context || '';
    
    // Add recent conversation history (last 10 messages)
    const recentMessages = chat.messages.slice(-10);
    if (recentMessages.length > 0) {
      const conversationHistory = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      context += `\n\nRecent conversation:\n${conversationHistory}`;
    }

    return context;
  }

  static async updateChatContext(chatId: string, userId: string, context: string): Promise<boolean> {
    const chat = await this.getChatById(chatId, userId);
    
    if (!chat) {
      return false;
    }

    chat.context = context;
    chat.updatedAt = new Date();
    chats.set(chat.id, chat);

    return true;
  }
}
