import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

class DatabaseConfig {
  private static instance: DatabaseConfig;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'chat_db',
      password: process.env.DB_PASS || '',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);

    this.pool.on('connect', () => {
      logger.info('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.info('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { text, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseConfig;
