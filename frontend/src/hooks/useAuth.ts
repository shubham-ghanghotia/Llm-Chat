import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { storageService } from '../services/storageService';
import { socketService } from '../services/socketService';
import type { User, AuthCredentials, RegisterData } from '../types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = storageService.getUser();
        const storedToken = storageService.getToken();

        if (storedUser && storedToken) {
          // Validate token with server
          const response = await apiService.getProfile(storedToken);
          if (response.success && response.data) {
            setUser(response.data.user);
            setToken(storedToken);
            socketService.connect(storedToken);
          } else {
            // Token is invalid, clear storage
            storageService.clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        storageService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        storageService.setUser(userData);
        storageService.setToken(authToken);
        
        socketService.connect(authToken);
        
        return Promise.resolve();
      } else {
        throw new Error(response.message || ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.AUTHENTICATION_FAILED;
      setError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        const { user: newUser, token: authToken } = response.data;
        
        setUser(newUser);
        setToken(authToken);
        
        storageService.setUser(newUser);
        storageService.setToken(authToken);
        
        socketService.connect(authToken);
        
        return Promise.resolve();
      } else {
        throw new Error(response.message || ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.AUTHENTICATION_FAILED;
      setError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      
      storageService.clearAuth();
      socketService.disconnect();
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
