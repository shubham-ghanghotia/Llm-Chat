import { API_CONFIG } from '../constants';
import type { 
  ApiResponse, 
  AuthResponse, 
  AuthCredentials, 
  RegisterData, 
  User,
  Chat,
  Message 
} from '../types';

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Network error');
    }
  }

  private getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Auth endpoints
  async login(credentials: AuthCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async logout(token: string): Promise<ApiResponse<void>> {
    return this.request<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });
  }

  // Chat endpoints
  async getChats(token: string): Promise<ApiResponse<{ chats: Chat[] }>> {
    return this.request<{ chats: Chat[] }>(API_CONFIG.ENDPOINTS.CHAT.BASE, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async getChat(token: string, chatId: string): Promise<ApiResponse<{ chat: Chat }>> {
    return this.request<{ chat: Chat }>(`${API_CONFIG.ENDPOINTS.CHAT.BASE}/${chatId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async createChat(token: string, title: string, context?: string): Promise<ApiResponse<{ chat: Chat }>> {
    return this.request<{ chat: Chat }>(API_CONFIG.ENDPOINTS.CHAT.BASE, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ title, context }),
    });
  }

  async updateChatTitle(token: string, chatId: string, title: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${API_CONFIG.ENDPOINTS.CHAT.BASE}/${chatId}/title`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ title }),
    });
  }

  async deleteChat(token: string, chatId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${API_CONFIG.ENDPOINTS.CHAT.BASE}/${chatId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
  }

  async addMessage(
    token: string, 
    chatId: string, 
    content: string, 
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  ): Promise<ApiResponse<{ message: Message }>> {
    return this.request<{ message: Message }>(
      `${API_CONFIG.ENDPOINTS.CHAT.BASE}/${chatId}/messages`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ content, role }),
      }
    );
  }
}

// Export singleton instance
export const apiService = new ApiService();
