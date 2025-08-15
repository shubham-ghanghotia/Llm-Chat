import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AuthModal } from '../AuthModal';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../hooks/useTheme';
import { socketService } from '../../services/socketService';
import type { User } from '../../types';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // Hooks
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { 
    chats, 
    activeChat, 
    isLoading: chatLoading, 
    createChat, 
    setActiveChat, 
    deleteChat, 
    sendMessage 
  } = useChat();
  const { isDark, toggleTheme } = useTheme();

  // Socket connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(socketService.getConnectionStatus());
    };

    updateConnectionStatus();
    
    // Listen for connection changes
    const interval = setInterval(updateConnectionStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Socket event handlers
  useEffect(() => {
    const handlers = {
      onTypingStart: () => setIsTyping(true),
      onTypingEnd: () => setIsTyping(false),
    };

    socketService.setEventHandlers(handlers);
  }, []);

  // Event handlers
  const handleNewChat = () => {
    createChat();
    setInputValue(''); // Clear input when creating new chat
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    setInputValue(''); // Clear input when switching chats
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!inputValue.trim()) return;

    try {
      await sendMessage(inputValue.trim());
      setInputValue(''); // Clear input after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleAuthSuccess = (token: string, userData: User) => {
    setShowAuthModal(false);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleToggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${className}`}>
      {/* Sidebar - Fixed on mobile, relative on desktop */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChat?.id || null}
        user={user}
        isAuthenticated={isAuthenticated}
        isOpen={sidebarOpen}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onToggleSettings={handleToggleSettings}
        onLogout={handleLogout}
        onLogin={handleLogin}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area - Adjusts width based on sidebar state */}
      <main className={`flex-1 flex flex-col relative z-10 transition-all duration-300`}>
        {/* Header */}
        <ChatHeader
          title={activeChat?.title || "New Chat"}
          connectionStatus={connectionStatus}
          isDarkMode={isDark}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onToggleTheme={toggleTheme}
        />

        {/* Messages */}
        <ChatMessages
          chat={activeChat}
          isTyping={isTyping}
        />

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <ChatInput
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSendMessage}
            placeholder={connectionStatus !== 'connected' ? "Connecting..." : "Type your message..."}
            disabled={connectionStatus !== 'connected' || isTyping}
            isLoading={isTyping}
          />
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
