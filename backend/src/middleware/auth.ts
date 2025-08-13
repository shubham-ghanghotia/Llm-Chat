import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import MonitoringService from '../services/MonitoringService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

class AuthMiddleware {
  private jwtSecret: string;
  private monitoring: MonitoringService;

  constructor() {
    this.jwtSecret = process.env.JWT_KEY || 'default-secret';
    this.monitoring = MonitoringService.getInstance();
  }

  public authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        const duration = Date.now() - startTime;
        this.monitoring.recordHttpError(req.method, req.path, 'missing_token');
        this.monitoring.recordHttpRequest(req.method, req.path, 401, duration);

        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          const duration = Date.now() - startTime;
          this.monitoring.recordHttpError(req.method, req.path, 'invalid_token');
          this.monitoring.recordHttpRequest(req.method, req.path, 403, duration);

          logger.warn('Invalid token provided', { error: err.message });

          res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
          });
          return;
        }

        req.user = {
          id: decoded.id,
          email: decoded.email
        };

        const duration = Date.now() - startTime;
        this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

        next();
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'auth_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Authentication middleware error', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public generateToken(userId: string, email?: string): string {
    return jwt.sign(
      { id: userId, email },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }
}

const authMiddleware = new AuthMiddleware();
export const authenticateToken = authMiddleware.authenticateToken;
export const generateToken = authMiddleware.generateToken.bind(authMiddleware);
export const verifyToken = authMiddleware.verifyToken.bind(authMiddleware);
