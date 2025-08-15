import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../constants';
import type { SocketMessage, SocketResponse, ConnectionStatus } from '../types';

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthError?: (error: any) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  onResponseChunk?: (data: SocketResponse) => void;
  onResponseEnd?: () => void;
  onResponseError?: (error: any) => void;
  onChatCreated?: (data: any) => void;
  onUserChats?: (data: any) => void;
  onChatDeleted?: (data: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventHandlers: SocketEventHandlers = {};
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Connection events
    this.on(SOCKET_CONFIG.EVENTS.CONNECT, () => {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnect?.();
    });

    this.on(SOCKET_CONFIG.EVENTS.DISCONNECT, () => {
      this.connectionStatus = 'disconnected';
      this.eventHandlers.onDisconnect?.();
    });

    // Auth events
    this.on(SOCKET_CONFIG.EVENTS.AUTH_ERROR, (error) => {
      this.connectionStatus = 'error';
      this.eventHandlers.onAuthError?.(error);
    });

    // Chat events
    this.on(SOCKET_CONFIG.EVENTS.LLM_TYPING_START, () => {
      this.eventHandlers.onTypingStart?.();
    });

    this.on(SOCKET_CONFIG.EVENTS.LLM_TYPING_END, () => {
      this.eventHandlers.onTypingEnd?.();
    });

    this.on(SOCKET_CONFIG.EVENTS.LLM_RESPONSE_CHUNK, (data) => {
      this.eventHandlers.onResponseChunk?.(data);
    });

    this.on(SOCKET_CONFIG.EVENTS.LLM_RESPONSE_END, () => {
      this.eventHandlers.onResponseEnd?.();
    });

    this.on(SOCKET_CONFIG.EVENTS.LLM_RESPONSE_ERROR, (error) => {
      this.eventHandlers.onResponseError?.(error);
    });

    this.on(SOCKET_CONFIG.EVENTS.CHAT_CREATED, (data) => {
      this.eventHandlers.onChatCreated?.(data);
    });

    this.on(SOCKET_CONFIG.EVENTS.USER_CHATS, (data) => {
      this.eventHandlers.onUserChats?.(data);
    });

    this.on(SOCKET_CONFIG.EVENTS.CHAT_DELETED, (data) => {
      this.eventHandlers.onChatDeleted?.(data);
    });
  }

  private on(event: string, handler: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  private off(event: string, handler?: (...args: any[]) => void): void {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.connectionStatus = 'connecting';

    this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
      this.connectionStatus = 'disconnected';
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Chat methods
  sendMessage(message: SocketMessage): void {
    this.emit(SOCKET_CONFIG.EVENTS.CHAT_WITH_LLM, message);
  }

  createChat(title: string, context?: string): void {
    this.emit('create-chat', { title, context });
  }

  getUserChats(): void {
    this.emit('get-user-chats');
  }

  deleteChat(chatId: string): void {
    this.emit('delete-chat', { chatId });
  }

  // Event handler registration
  setEventHandlers(handlers: SocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
