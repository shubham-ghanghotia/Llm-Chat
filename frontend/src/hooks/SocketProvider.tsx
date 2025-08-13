import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface SocketContextType {
  socket: Socket | null;
}

interface SocketProviderProps {
  children: ReactNode;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string;

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('Connecting to server:', SERVER_URL);
    const socketInstance = io(SERVER_URL, {
      auth: {
        token: token
      }
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket connected from provider');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketInstance.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
    });
    
    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting socket');
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}


export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
