// User related types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  username: string;
}

// Chat related types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Socket event types
export interface SocketMessage {
  content: string;
  chatId?: string;
  userId?: string;
  context?: string;
}

export interface SocketResponse {
  chunk?: string;
  message?: Message;
  chatId?: string;
  error?: string;
}

// UI Component Props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface TypingIndicatorProps {
  className?: string;
}

export interface MessageProps {
  message: Message;
  className?: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: User) => void;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  username: string;
}

// Theme types
export type Theme = 'light' | 'dark';

// Connection status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
