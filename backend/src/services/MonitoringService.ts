import promClient from 'prom-client';
import { logger } from '../utils/logger';

class MonitoringService {
  private static instance: MonitoringService;
  
  // Metrics
  public httpRequestDuration: promClient.Histogram;
  public httpRequestTotal: promClient.Counter;
  public httpRequestErrors: promClient.Counter;
  public activeConnections: promClient.Gauge;
  public chatMessagesTotal: promClient.Counter;
  public userRegistrations: promClient.Counter;
  public userLogins: promClient.Counter;
  public aiResponseTime: promClient.Histogram;
  public databaseQueryDuration: promClient.Histogram;

  private constructor() {
    // Enable default metrics
    promClient.collectDefaultMetrics();

    // HTTP Request Duration
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // HTTP Request Total
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // HTTP Request Errors
    this.httpRequestErrors = new promClient.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
    });

    // Active Connections
    this.activeConnections = new promClient.Gauge({
      name: 'websocket_active_connections',
      help: 'Number of active WebSocket connections',
    });

    // Chat Messages Total
    this.chatMessagesTotal = new promClient.Counter({
      name: 'chat_messages_total',
      help: 'Total number of chat messages',
      labelNames: ['role', 'user_id'],
    });

    // User Registrations
    this.userRegistrations = new promClient.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
    });

    // User Logins
    this.userLogins = new promClient.Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
    });

    // AI Response Time
    this.aiResponseTime = new promClient.Histogram({
      name: 'ai_response_time_seconds',
      help: 'AI response time in seconds',
      labelNames: ['model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    // Database Query Duration
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    logger.info('Monitoring service initialized');
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // HTTP Request Metrics
  public recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration / 1000); // Convert to seconds

    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  public recordHttpError(method: string, route: string, errorType: string): void {
    this.httpRequestErrors
      .labels(method, route, errorType)
      .inc();
  }

  // WebSocket Metrics
  public setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  public incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  public decrementActiveConnections(): void {
    this.activeConnections.dec();
  }

  // Chat Metrics
  public recordChatMessage(role: string, userId: string): void {
    this.chatMessagesTotal
      .labels(role, userId)
      .inc();
  }

  // User Metrics
  public recordUserRegistration(): void {
    this.userRegistrations.inc();
  }

  public recordUserLogin(): void {
    this.userLogins.inc();
  }

  // AI Metrics
  public recordAIResponseTime(model: string, duration: number): void {
    this.aiResponseTime
      .labels(model)
      .observe(duration / 1000); // Convert to seconds
  }

  // Database Metrics
  public recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.databaseQueryDuration
      .labels(operation, table)
      .observe(duration / 1000); // Convert to seconds
  }

  // Get metrics for Prometheus endpoint
  public async getMetrics(): Promise<string> {
    try {
      return await promClient.register.metrics();
    } catch (error) {
      logger.error('Failed to get metrics', error);
      throw error;
    }
  }

  // Get metrics in JSON format
  public async getMetricsJson(): Promise<any> {
    try {
      const metrics = await promClient.register.getMetricsAsJSON();
      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics as JSON', error);
      throw error;
    }
  }
}

export default MonitoringService;
