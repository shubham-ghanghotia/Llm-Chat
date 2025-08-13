import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import MonitoringService from '../services/MonitoringService';
import UserModel, { CreateUserData, LoginCredentials } from '../models/UserModel';
import { generateToken } from '../middleware/auth';

class AuthController {
  private userModel: UserModel;
  private monitoring: MonitoringService;
  private jwtSecret: string;

  constructor(userModel: UserModel) {
    this.userModel = userModel;
    this.monitoring = MonitoringService.getInstance();
    this.jwtSecret = process.env.JWT_KEY || 'default-secret';
  }

  // Register new user
  public async register(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { email, username, password }: CreateUserData = req.body;

      // Validate input
      if (!email || !username || !password) {
        res.status(400).json({
          success: false,
          message: 'Email, username, and password are required'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      // Create user
      const user = await this.userModel.createUser({ email, username, password });

      // Generate JWT token
      const token = generateToken(user.id);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 201, duration);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt
          },
          token
        }
      });

      logger.info('User registration successful', { userId: user.id, email });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'registration_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 400, duration);

      logger.error('User registration failed', { error: error.message });

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  // Login user
  public async login(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { email, password }: LoginCredentials = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Authenticate user
      const user = await this.userModel.authenticateUser({ email, password });

      // Generate JWT token
      const token = generateToken(user.id);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          },
          token
        }
      });

      logger.info('User login successful', { userId: user.id, email });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'login_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 401, duration);

      logger.error('User login failed', { error: error.message });

      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  }

  // Get user profile
  public async getProfile(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await this.userModel.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'profile_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Get profile failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  public async updateProfile(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user?.id;
      const { username, email } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
        return;
      }

      const user = await this.userModel.updateUser(userId, updateData);

      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });

      logger.info('Profile updated successfully', { userId });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'update_profile_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Update profile failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout (client-side token removal)
  public async logout(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpRequest(req.method, req.path, 200, duration);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

      logger.info('User logout', { userId: (req as any).user?.id });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.monitoring.recordHttpError(req.method, req.path, 'logout_error');
      this.monitoring.recordHttpRequest(req.method, req.path, 500, duration);

      logger.error('Logout failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


}

export default AuthController;
