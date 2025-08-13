export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// In-memory user storage (replace with database in production)
const users: Map<string, User> = new Map();

export class UserModel {
  static async createUser(email: string, username: string, password: string): Promise<UserProfile> {
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      user => user.email === email || user.username === username
    );
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    users.set(user.id, user);
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  static async authenticateUser(email: string, password: string): Promise<UserProfile> {
    const bcrypt = require('bcryptjs');
    
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    users.set(user.id, user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  static async getUserById(id: string): Promise<UserProfile | null> {
    const user = users.get(id);
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }
}
