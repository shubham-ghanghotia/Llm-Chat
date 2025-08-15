import React from 'react';
import { Button } from '../ui/button';
import { Menu, X, Moon, Sun } from 'lucide-react';
import type { ConnectionStatus } from '../../types';

interface ChatHeaderProps {
  title: string;
  connectionStatus: ConnectionStatus;
  isDarkMode: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  connectionStatus,
  isDarkMode,
  sidebarOpen,
  onToggleSidebar,
  onToggleTheme,
  className = '',
}) => {
  const getConnectionStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-red-500';
    }
  };

  const getConnectionStatusText = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className={`flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <h1 className="font-semibold text-lg">
          {title}
        </h1>
        {connectionStatus !== 'connected' && (
          <div className={`flex items-center gap-1 text-sm ${getConnectionStatusColor(connectionStatus)}`}>
            <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(connectionStatus).replace('text-', 'bg-')}`}></div>
            {getConnectionStatusText(connectionStatus)}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onToggleTheme}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>
    </div>
  );
};
