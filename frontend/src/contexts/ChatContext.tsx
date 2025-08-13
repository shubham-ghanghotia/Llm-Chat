import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'CREATE_CHAT'; payload: Chat }
  | { type: 'SET_ACTIVE_CHAT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; updates: Partial<Message> } }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'UPDATE_CHAT_ID'; payload: { oldId: string; newId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_CHATS'; payload: Chat[] };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'CREATE_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        activeChatId: action.payload.id
      };
    
    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChatId: action.payload
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: [...chat.messages, action.payload.message],
                updatedAt: Date.now()
              }
            : chat
        )
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { ...msg, ...action.payload.updates }
                    : msg
                ),
                updatedAt: Date.now()
              }
            : chat
        )
      };
    
    case 'DELETE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        activeChatId: state.activeChatId === action.payload ? null : state.activeChatId
      };
    
    case 'UPDATE_CHAT_ID':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.oldId
            ? { ...chat, id: action.payload.newId }
            : chat
        ),
        activeChatId: state.activeChatId === action.payload.oldId ? action.payload.newId : state.activeChatId
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'LOAD_CHATS':
      return {
        ...state,
        chats: action.payload
      };
    
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  createChat: (title?: string) => string;
  addMessage: (chatId: string, content: string, role: Message['role']) => string;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteChat: (chatId: string) => void;
  getActiveChat: () => Chat | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedChats, setStoredChats] = useLocalStorage<Chat[]>('chats', []);
  
  const initialState: ChatState = {
    chats: storedChats,
    activeChatId: storedChats.length > 0 ? storedChats[0].id : null,
    isLoading: false,
    error: null
  };

  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Sync state changes to localStorage
  React.useEffect(() => {
    setStoredChats(state.chats);
  }, [state.chats, setStoredChats]);

  const createChat = (title?: string): string => {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chat: Chat = {
      id,
      title: title || `New Chat ${state.chats.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    dispatch({ type: 'CREATE_CHAT', payload: chat });
    return id;
  };

  const addMessage = (chatId: string, content: string, role: Message['role']): string => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: Message = {
      id: messageId,
      role,
      content,
      timestamp: Date.now(),
      status: 'sent'
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message } });
    return messageId;
  };

  const updateMessage = (chatId: string, messageId: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { chatId, messageId, updates } });
  };

  const deleteChat = (chatId: string) => {
    dispatch({ type: 'DELETE_CHAT', payload: chatId });
  };

  const getActiveChat = (): Chat | null => {
    return state.chats.find(chat => chat.id === state.activeChatId) || null;
  };

  const value: ChatContextType = {
    state,
    dispatch,
    createChat,
    addMessage,
    updateMessage,
    deleteChat,
    getActiveChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
