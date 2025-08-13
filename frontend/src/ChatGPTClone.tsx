import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Moon, Sun, Menu, X, Plus, Trash2, Settings, LogOut, User } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketContext } from "./hooks/SocketProvider";
import { useChat } from "./contexts/ChatContext";
import { useAuth } from "./contexts/AuthContext";
import { Message } from "./components/Message";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { TypingIndicator } from "./components/ui/typing-indicator";
import { AuthModal } from "./components/AuthModal";
import { useLocalStorage } from "./hooks/useLocalStorage";

export default function ChatGPTClone() {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("darkMode", true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useSocketContext();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { 
    state, 
    createChat, 
    addMessage, 
    updateMessage, 
    deleteChat, 
    getActiveChat,
    dispatch 
  } = useChat();

  const activeChat = getActiveChat();
  const currentAssistantMessage = useRef("");

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Socket connection status
  useEffect(() => {
    if (socket) {
      console.log('Socket connection status:', socket.connected);
      setIsConnected(socket.connected);
      
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket]);

  // Socket event listeners
  useEffect(() => {
    if (socket && activeChat) {
      socket.on("llm-typing-start", () => {
        setIsTyping(true);
      });

      socket.on("llm-typing-end", () => {
        setIsTyping(false);
      });

      socket.on("llm-response-chunk", (data) => {
        currentAssistantMessage.current += data.chunk;
        
        // Update or create assistant message
        const lastMessage = activeChat.messages[activeChat.messages.length - 1];
        if (lastMessage?.role === "assistant") {
          updateMessage(activeChat.id, lastMessage.id, { 
            content: currentAssistantMessage.current 
          });
        } else {
          addMessage(activeChat.id, currentAssistantMessage.current, "assistant");
        }
      });

      socket.on("llm-response-end", () => {
        currentAssistantMessage.current = "";
        setIsTyping(false);
      });

      socket.on("llm-response-error", (err) => {
        console.error("LLM error:", err);
        setIsTyping(false);
        
        // Add error message
        if (activeChat) {
          addMessage(activeChat.id, `Error: ${err.error}`, "assistant");
        }
      });

      socket.on("chat-created", (data) => {
        console.log('Chat created on server:', data);
        // Update the active chat with the server-generated ID
        if (activeChat && activeChat.id !== data.chatId) {
          // Replace the local chat ID with the server chat ID
          dispatch({ 
            type: 'UPDATE_CHAT_ID', 
            payload: { oldId: activeChat.id, newId: data.chatId } 
          });
        }
      });

      return () => {
        socket.off("llm-typing-start");
        socket.off("llm-typing-end");
        socket.off("llm-response-chunk");
        socket.off("llm-response-end");
        socket.off("llm-response-error");
        socket.off("chat-created");
      };
    }
  }, [socket, activeChat, addMessage, updateMessage]);

  const sendMessage = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    console.log('sendMessage called', { 
      input: input.trim(), 
      socket: !!socket, 
      isConnected, 
      activeChat: !!activeChat,
      userId: user?.id
    });
    
    if (!input.trim() || !socket || !isConnected) {
      console.log('sendMessage early return', { 
        hasInput: !!input.trim(), 
        hasSocket: !!socket, 
        isConnected 
      });
      return;
    }
    
    // Ensure there's an active chat
    let currentChat = activeChat;
    if (!currentChat) {
      console.log('Creating new chat');
      createChat();
      currentChat = getActiveChat();
    }
    
    if (!currentChat) {
      console.log('No active chat available');
      return;
    }
    
    console.log('Sending message to chat:', currentChat.id);
    const messageId = addMessage(currentChat.id, input.trim(), "user");
    setInput("");
    resizeTextarea();
    
    // Update message status to sending
    updateMessage(currentChat.id, messageId, { status: 'sending' });
    
    // Send to socket with user context
    socket.emit('chat-with-llm', { 
      content: input.trim(),
      userId: user?.id,
      chatId: currentChat.id
    });
    console.log('Message sent to socket');
    
    // Update message status to sent
    updateMessage(currentChat.id, messageId, { status: 'sent' });
  };

  const handleAuthSuccess = (token: string, userData: any) => {
    login(token, userData);
  };

  const handleNewChat = () => {
    createChat();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatChatTitle = (title: string, timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${title} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${title} • ${date.toLocaleDateString()}`;
    }
  };

  return (
    <div
      className={clsx(
        "flex h-screen w-full overflow-hidden",
        darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-black"
      )}
    >
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={clsx(
          "fixed md:static top-0 left-0 z-40 h-full w-64 border-r",
          darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold">Chats</h2>
          <div className="flex gap-1">
            {isAuthenticated && (
              <div className="flex items-center gap-2 mr-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
            {isAuthenticated ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={logout}
                className="h-8 w-8"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAuthModal(true)}
                className="h-8 w-8"
                title="Login"
              >
                <User className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleNewChat}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          
          <AnimatePresence>
            {state.chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={clsx(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer",
                  state.activeChatId === chat.id
                    ? darkMode
                      ? "bg-gray-700"
                      : "bg-gray-200"
                    : darkMode
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100"
                )}
                onClick={() => dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat.id })}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {formatChatTitle(chat.title, chat.updatedAt)}
                  </div>
                  {chat.messages.length > 0 && (
                    <div className="text-xs opacity-70 truncate">
                      {chat.messages[chat.messages.length - 1].content.substring(0, 50)}...
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col relative z-10 w-full">
        {/* Topbar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="font-semibold text-lg">
              {activeChat?.title || "New Chat"}
            </h1>
            {!isConnected && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Disconnected
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 space-y-4">
          {activeChat?.messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <h3 className="text-lg font-medium mb-2">Welcome to AI Chat</h3>
              <p className="text-sm">Start a conversation by typing a message below.</p>
            </div>
          )}
          
          <AnimatePresence>
                         {activeChat?.messages.map((message) => (
               <Message
                 key={message.id}
                 message={message}
               />
             ))}
          </AnimatePresence>
          
          {isTyping && <TypingIndicator />}
          <div ref={scrollRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              placeholder={!isConnected ? "Connecting..." : "Type your message..."}
              value={input}
              rows={1}
              disabled={!isConnected || isTyping}
              onChange={(e) => {
                setInput(e.target.value);
                resizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 max-h-40 min-h-[40px] resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || !isConnected || isTyping}
              className="self-end"
            >
              {isTyping ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-lg">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
