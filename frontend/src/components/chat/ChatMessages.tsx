import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';
import { Message } from '../Message';
import { TypingIndicator } from '../ui/typing-indicator';
import type { Chat } from '../../types';

interface ChatMessagesProps {
  chat: Chat | null;
  isTyping: boolean;
  className?: string;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  chat,
  isTyping,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  return (
    <ScrollArea className={`flex-1 p-4 space-y-4 ${className}`}>
      {!chat || chat.messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <h3 className="text-lg font-medium mb-2">Welcome to AI Chat</h3>
          <p className="text-sm">Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <AnimatePresence>
          {chat.messages.map((message) => (
            <Message
              key={message.id}
              message={message}
            />
          ))}
        </AnimatePresence>
      )}
      
      {isTyping && <TypingIndicator />}
      <div ref={scrollRef} />
    </ScrollArea>
  );
};
