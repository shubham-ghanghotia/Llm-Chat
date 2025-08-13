import { Router } from 'express';
import ChatController from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';

class ChatRoutes {
  private router: Router;
  private chatController: ChatController;

  constructor(chatController: ChatController) {
    this.router = Router();
    this.chatController = chatController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All chat routes require authentication
    this.router.use(authenticateToken);

    // Chat management
    this.router.post('/', (req, res) => this.chatController.createChat(req, res));
    this.router.get('/', (req, res) => this.chatController.getUserChats(req, res));
    this.router.get('/stats', (req, res) => this.chatController.getChatStats(req, res));
    
    // Specific chat operations
    this.router.get('/:chatId', (req, res) => this.chatController.getChat(req, res));
    this.router.put('/:chatId/title', (req, res) => this.chatController.updateChatTitle(req, res));
    this.router.delete('/:chatId', (req, res) => this.chatController.deleteChat(req, res));
    
    // Message operations
    this.router.post('/:chatId/messages', (req, res) => this.chatController.addMessage(req, res));
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default ChatRoutes;
