import { config } from 'dotenv';

config();

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL as keyof LogLevel] ?? LOG_LEVELS.INFO;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private formatLog(level: string, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error : undefined
    };
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return LOG_LEVELS[level] <= currentLogLevel;
  }

  private output(entry: LogEntry): void {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Pretty print for development
      const colorMap = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[35m'  // Magenta
      };
      
      const reset = '\x1b[0m';
      const color = colorMap[entry.level as keyof typeof colorMap] || '';
      
      console.log(`${color}[${entry.level}]${reset} ${entry.timestamp} - ${entry.message}`);
      
      if (entry.data) {
        console.log(`${color}Data:${reset}`, entry.data);
      }
      
      if (entry.error) {
        console.error(`${color}Error:${reset}`, entry.error);
      }
    } else {
      // JSON format for production
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, data?: any, error?: Error): void {
    if (this.shouldLog('ERROR')) {
      this.output(this.formatLog('ERROR', message, data, error));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      this.output(this.formatLog('WARN', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      this.output(this.formatLog('INFO', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      this.output(this.formatLog('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();
