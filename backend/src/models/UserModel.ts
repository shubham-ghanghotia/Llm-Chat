import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import MonitoringService from '../services/MonitoringService';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class UserModel {
  private prisma: PrismaClient;
  private monitoring: MonitoringService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.monitoring = MonitoringService.getInstance();
  }

  // Create a new user
  public async createUser(data: CreateUserData): Promise<UserProfile> {
    const startTime = Date.now();
    
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { username: data.username }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
        }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'users', duration);
      this.monitoring.recordUserRegistration();

      logger.info('User created successfully', { userId: user.id, email: user.email });

      return this.mapToUserProfile(user);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('create', 'users', duration);
      logger.error('Failed to create user', { error, email: data.email });
      throw error;
    }
  }

  // Authenticate user
  public async authenticateUser(credentials: LoginCredentials): Promise<UserProfile> {
    const startTime = Date.now();
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'users', duration);
      this.monitoring.recordUserLogin();

      logger.info('User authenticated successfully', { userId: user.id, email: user.email });

      return this.mapToUserProfile(updatedUser);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'users', duration);
      logger.error('Authentication failed', { error, email: credentials.email });
      throw error;
    }
  }

  // Get user by ID
  public async getUserById(id: string): Promise<UserProfile | null> {
    const startTime = Date.now();
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'users', duration);

      if (!user || !user.isActive) {
        return null;
      }

      return this.mapToUserProfile(user);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'users', duration);
      logger.error('Failed to get user by ID', { error, userId: id });
      throw error;
    }
  }

  // Get user by email
  public async getUserByEmail(email: string): Promise<UserProfile | null> {
    const startTime = Date.now();
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'users', duration);

      if (!user || !user.isActive) {
        return null;
      }

      return this.mapToUserProfile(user);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('find', 'users', duration);
      logger.error('Failed to get user by email', { error, email });
      throw error;
    }
  }

  // Update user profile
  public async updateUser(id: string, data: any): Promise<UserProfile> {
    const startTime = Date.now();
    
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'users', duration);

      logger.info('User updated successfully', { userId: id });

      return this.mapToUserProfile(user);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'users', duration);
      logger.error('Failed to update user', { error, userId: id });
      throw error;
    }
  }

  // Deactivate user
  public async deactivateUser(id: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'users', duration);

      logger.info('User deactivated successfully', { userId: id });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('update', 'users', duration);
      logger.error('Failed to deactivate user', { error, userId: id });
      throw error;
    }
  }

  // Get all users (for admin purposes)
  public async getAllUsers(): Promise<UserProfile[]> {
    const startTime = Date.now();
    
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('findMany', 'users', duration);

      return users.map(user => this.mapToUserProfile(user));
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('findMany', 'users', duration);
      logger.error('Failed to get all users', { error });
      throw error;
    }
  }

  // Get user statistics
  public async getUserStats(): Promise<{ total: number; active: number; inactive: number }> {
    const startTime = Date.now();
    
    try {
      const [total, active] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } })
      ]);

      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('count', 'users', duration);

      return {
        total,
        active,
        inactive: total - active
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.recordDatabaseQuery('count', 'users', duration);
      logger.error('Failed to get user stats', { error });
      throw error;
    }
  }

  // Private helper method to map User to UserProfile
  private mapToUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt || undefined
    };
  }
}

export default UserModel;
