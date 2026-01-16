/**
 * Logger Service
 * Centralized logging service for the application
 *
 * Usage:
 * import { logger } from '@/services/Logger';
 * logger.info('Message', { context: 'data' });
 * logger.error('Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeEmoji: boolean;
}

class Logger {
  private config: LoggerConfig = {
    enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true',
    level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
    includeTimestamp: true,
    includeEmoji: true,
  };

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.includeEmoji) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      parts.push(emoji);
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Log informational message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  /**
   * Group logs together (useful for related operations)
   */
  group(label: string): void {
    if (this.config.enabled) {
      console.group(this.formatMessage('info', label));
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Log execution time of a function
   */
  time(label: string): void {
    if (this.config.enabled) {
      console.time(this.formatMessage('debug', label));
    }
  }

  /**
   * End time measurement
   */
  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(this.formatMessage('debug', label));
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LoggerConfig };
