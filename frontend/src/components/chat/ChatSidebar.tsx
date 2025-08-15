import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Plus, Trash2, Settings, LogOut, User, X } from 'lucide-react';
import { formatChatTitle } from '../../utils/dateUtils';
import { UI_CONFIG } from '../../constants';
import type { Chat, User as UserType } from '../../types';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  user: UserType | null;
  isAuthenticated: boolean;
  isOpen: boolean;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onToggleSettings: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onClose: () => void;
  className?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  user,
  isAuthenticated,
  isOpen,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onToggleSettings,
  onLogout,
  onLogin,
  onClose,
  className = '',
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{ 
        x: isOpen ? 0 : -300,
        width: isOpen ? 256 : 0 // 256px = w-64
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed md:relative top-0 left-0 z-40 h-full border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-black dark:text-white overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">Chats</h2>
        <div className="flex gap-1">
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 mr-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSettings}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {isAuthenticated ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogout}
              className="h-8 w-8"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogin}
              className="h-8 w-8"
              title="Login"
            >
              <User className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="md:hidden h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Chat List */}
      <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={onNewChat}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`group flex items-center justify-between p-2 rounded-md cursor-pointer ${
                activeChatId === chat.id
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {formatChatTitle(chat.title, chat.updatedAt)}
                </div>
                {chat.messages.length > 0 && (
                  <div className="text-xs opacity-70 truncate">
                    {chat.messages[chat.messages.length - 1].content.substring(0, UI_CONFIG.MESSAGE_PREVIEW_LENGTH)}...
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
