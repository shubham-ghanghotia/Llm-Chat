import { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from '../services/storageService';
import { socketService } from '../services/socketService';
import { CHAT_CONFIG } from '../constants';
import type { Chat, Message, SocketResponse } from '../types';

interface UseChatReturn {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  createChat: (title?: string) => string;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, content: string, role: Message['role']) => string;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAssistantMessage = useRef('');

  const activeChat = chats.find(chat => chat.id === activeChatId) || null;

  // Initialize chats from storage
  useEffect(() => {
    const storedChats = storageService.getChats();
    setChats(storedChats);
    if (storedChats.length > 0 && !activeChatId) {
      setActiveChatId(storedChats[0].id);
    }
  }, [activeChatId]);

  // Sync chats to storage
  useEffect(() => {
    storageService.setChats(chats);
  }, [chats]);

  // Setup socket event handlers
  useEffect(() => {
    const handlers = {
      onTypingStart: () => {
        // Handle typing start
      },
      onTypingEnd: () => {
        // Handle typing end
      },
      onResponseChunk: (data: SocketResponse) => {
        if (data.chunk && activeChat) {
          currentAssistantMessage.current += data.chunk;
          
          const lastMessage = activeChat.messages[activeChat.messages.length - 1];
          if (lastMessage?.role === 'assistant') {
            updateMessage(activeChat.id, lastMessage.id, { 
              content: currentAssistantMessage.current 
            });
          } else {
            addMessage(activeChat.id, currentAssistantMessage.current, 'assistant');
          }
        }
      },
      onResponseEnd: () => {
        currentAssistantMessage.current = '';
      },
      onResponseError: (error: any) => {
        setError(error.message || 'Failed to get AI response');
        if (activeChat) {
          addMessage(activeChat.id, `Error: ${error.message}`, 'assistant');
        }
      },
      onChatCreated: (data: any) => {
        if (data.chatId && activeChat && activeChat.id !== data.chatId) {
          // Update chat ID if it was created on server
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === activeChat.id 
                ? { ...chat, id: data.chatId }
                : chat
            )
          );
          setActiveChatId(data.chatId);
        }
      },
    };

    socketService.setEventHandlers(handlers);
  }, [activeChat]);

  const createChat = useCallback((title?: string): string => {
    const id = `${CHAT_CONFIG.CHAT_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chat: Chat = {
      id,
      title: title || `${CHAT_CONFIG.DEFAULT_CHAT_TITLE} ${chats.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setChats(prevChats => [chat, ...prevChats]);
    setActiveChatId(id);
    return id;
  }, [chats.length]);

  const setActiveChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  const addMessage = useCallback((chatId: string, content: string, role: Message['role']): string => {
    const messageId = `${CHAT_CONFIG.MESSAGE_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: Message = {
      id: messageId,
      role,
      content,
      timestamp: Date.now(),
      status: 'sent'
    };
    
    setChats(prevChats => 
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              updatedAt: Date.now()
            }
          : chat
      )
    );
    
    return messageId;
  }, []);

  const updateMessage = useCallback((chatId: string, messageId: string, updates: Partial<Message>) => {
    setChats(prevChats => 
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, ...updates }
                  : msg
              ),
              updatedAt: Date.now()
            }
          : chat
      )
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prevChats => {
      const filteredChats = prevChats.filter(chat => chat.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(filteredChats.length > 0 ? filteredChats[0].id : null);
      }
      return filteredChats;
    });
    
    // Notify server
    socketService.deleteChat(chatId);
  }, [activeChatId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeChat) {
      const newChatId = createChat();
      setActiveChatId(newChatId);
    }
    
    const currentChat = activeChat || chats.find(chat => chat.id === activeChatId);
    if (!currentChat) return;
    
    const messageId = addMessage(currentChat.id, content, 'user');
    updateMessage(currentChat.id, messageId, { status: 'sending' });
    
    try {
      socketService.sendMessage({
        content,
        chatId: currentChat.id,
        userId: storageService.getUser()?.id
      });
      
      updateMessage(currentChat.id, messageId, { status: 'sent' });
    } catch (error) {
      updateMessage(currentChat.id, messageId, { status: 'error' });
      setError('Failed to send message');
    }
  }, [activeChat, activeChatId, chats, createChat, addMessage, updateMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    chats,
    activeChat,
    isLoading,
    error,
    createChat,
    setActiveChat,
    addMessage,
    updateMessage,
    deleteChat,
    sendMessage,
    clearError,
  };
};
