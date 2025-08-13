import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../contexts/ChatContext';
import { User, Bot, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface MessageProps {
  message: MessageType;
  className?: string;
}

const MessageStatusIcon: React.FC<{ status?: MessageType['status'] }> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-yellow-500" />;
    case 'sent':
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

export const Message: React.FC<MessageProps> = ({ 
  message, 
  className = '' 
}) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'flex gap-3 p-4 rounded-lg max-w-4xl',
        isUser 
          ? 'ml-auto bg-blue-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs opacity-70">
            {formatTimestamp(message.timestamp)}
          </span>
          <MessageStatusIcon status={message.status} />
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return !isInline ? (
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
