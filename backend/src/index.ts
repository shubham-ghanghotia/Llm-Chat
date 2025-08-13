import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services and models
import PrismaService from './services/PrismaService';
import MonitoringService from './services/MonitoringService';
import UserModel from './models/UserModel';
import ChatModel from './models/ChatModel';

// Import controllers
import AuthController from './controllers/AuthController';
import ChatController from './controllers/ChatController';

// Import routes
import AuthRoutes from './routes/auth';
import ChatRoutes from './routes/chat';

// Import middleware
import { logger } from './utils/logger';

class Application {
  private app: express.Application;
  private server: any;
  private io: Server;
  private prismaService: PrismaService;
  private monitoringService: MonitoringService;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000');
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.prismaService = PrismaService.getInstance();
    this.monitoringService = MonitoringService.getInstance();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketHandlers();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Request monitoring middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.monitoringService.recordHttpRequest(req.method, req.path, res.statusCode, duration);
      });

      next();
    });
  }

  private initializeRoutes(): void {
    // Initialize models
    const prisma = this.prismaService.getClient();
    const userModel = new UserModel(prisma);
    const chatModel = new ChatModel(prisma);

    // Initialize controllers
    const authController = new AuthController(userModel);
    const chatController = new ChatController(chatModel);

    // Initialize routes
    const authRoutes = new AuthRoutes(authController);
    const chatRoutes = new ChatRoutes(chatController);

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await this.prismaService.healthCheck();
        const metrics = await this.monitoringService.getMetricsJson();
        
        res.status(200).json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealth ? 'healthy' : 'unhealthy',
            websocket: 'healthy'
          },
          metrics: {
            activeConnections: this.io.engine.clientsCount,
            uptime: process.uptime()
          }
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Service health check failed'
        });
      }
    });

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.monitoringService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get metrics'
        });
      }
    });

    // API routes
    this.app.use('/api/auth', authRoutes.getRouter());
    this.app.use('/api/chats', chatRoutes.getRouter());

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      
      this.monitoringService.recordHttpError(req.method, req.path, 'unhandled_error');
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });
  }

  private initializeSocketHandlers(): void {
    // Import and initialize socket handler
    const ChatSocketHandler = require('./socket/socket-handler/chat').default;
    const prisma = this.prismaService.getClient();
    const chatModel = new ChatModel(prisma);
    
    new ChatSocketHandler(this.io, chatModel);

    logger.info('Socket.IO server initialized');
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.prismaService.connect();
      logger.info('Connected to database');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`Metrics: http://localhost:${this.port}/metrics`);
      });

    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      // Close database connection
      await this.prismaService.disconnect();
      logger.info('Database connection closed');

      // Close server
      this.server.close(() => {
        logger.info('Server stopped');
        process.exit(0);
      });

    } catch (error) {
      logger.error('Error stopping server', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const app = new Application();
  await app.stop();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  const app = new Application();
  await app.stop();
});

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});