import { STORAGE_KEYS } from '../constants';
import type { User, Chat, Theme } from '../types';

class StorageService {
  private storage: Storage;

  constructor() {
    this.storage = window.localStorage;
  }

  // Generic methods
  private get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }

  private remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  // User related methods
  getUser(): User | null {
    return this.get<User>(STORAGE_KEYS.USER);
  }

  setUser(user: User): void {
    this.set(STORAGE_KEYS.USER, user);
  }

  removeUser(): void {
    this.remove(STORAGE_KEYS.USER);
  }

  // Token related methods
  getToken(): string | null {
    return this.get<string>(STORAGE_KEYS.TOKEN);
  }

  setToken(token: string): void {
    this.set(STORAGE_KEYS.TOKEN, token);
  }

  removeToken(): void {
    this.remove(STORAGE_KEYS.TOKEN);
  }

  // Chat related methods
  getChats(): Chat[] {
    return this.get<Chat[]>(STORAGE_KEYS.CHATS) || [];
  }

  setChats(chats: Chat[]): void {
    this.set(STORAGE_KEYS.CHATS, chats);
  }

  removeChats(): void {
    this.remove(STORAGE_KEYS.CHATS);
  }

  // Theme related methods
  getTheme(): Theme {
    return this.get<Theme>(STORAGE_KEYS.THEME) || 'dark';
  }

  setTheme(theme: Theme): void {
    this.set(STORAGE_KEYS.THEME, theme);
  }

  // Settings related methods
  getSettings(): Record<string, any> {
    return this.get<Record<string, any>>(STORAGE_KEYS.SETTINGS) || {};
  }

  setSettings(settings: Record<string, any>): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  updateSettings(updates: Record<string, any>): void {
    const currentSettings = this.getSettings();
    this.setSettings({ ...currentSettings, ...updates });
  }

  // Auth related methods
  clearAuth(): void {
    this.removeUser();
    this.removeToken();
  }

  // Clear all data
  clearAll(): void {
    this.storage.clear();
  }

  // Check if storage is available
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      this.storage.setItem(test, test);
      this.storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Get storage size
  getSize(): number {
    let size = 0;
    for (const key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        size += this.storage[key].length + key.length;
      }
    }
    return size;
  }
}

// Export singleton instance
export const storageService = new StorageService();
