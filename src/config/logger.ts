/**
 * Logger Configuration
 * Manages logging levels, output destinations, and log rotation settings
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRotationConfig {
  /** Maximum log file size in bytes */
  maxFileSize: number;
  /** Maximum number of log files to keep */
  maxFiles: number;
  /** Whether to compress rotated logs */
  compress: boolean;
}

export interface LoggerConfig {
  /** Logging level */
  level: LogLevel;
  /** Output to console */
  console: boolean;
  /** Output to file */
  file: boolean;
  /** File path for logs (when file is true) */
  filePath?: string;
  /** Log rotation configuration */
  rotation?: LogRotationConfig;
  /** Enable pretty printing for console output */
  prettyPrint: boolean;
  /** Maximum body size to log (in bytes, 0 = unlimited) */
  maxBodySize: number;
  /** Enable sensitive data redaction */
  redactSensitiveData: boolean;
}

/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  console: true,
  file: false,
  prettyPrint: true,
  maxBodySize: 10000, // 10KB
  redactSensitiveData: true,
  rotation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
  },
};

/**
 * Log level priorities for filtering
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if a log should be output based on configured level
 */
export function shouldLog(configLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[messageLevel] >= LOG_LEVEL_PRIORITY[configLevel];
}

/**
 * Create logger configuration from environment variables
 */
export function createLoggerConfigFromEnv(): LoggerConfig {
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || DEFAULT_LOGGER_CONFIG.level,
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH,
    prettyPrint: process.env.LOG_PRETTY_PRINT !== 'false',
    maxBodySize: parseInt(
      process.env.LOG_MAX_BODY_SIZE || String(DEFAULT_LOGGER_CONFIG.maxBodySize),
      10
    ),
    redactSensitiveData: process.env.LOG_REDACT_SENSITIVE !== 'false',
    rotation: {
      maxFileSize: parseInt(
        process.env.LOG_ROTATION_MAX_SIZE ||
          String(DEFAULT_LOGGER_CONFIG.rotation?.maxFileSize || 0),
        10
      ),
      maxFiles: parseInt(
        process.env.LOG_ROTATION_MAX_FILES || String(DEFAULT_LOGGER_CONFIG.rotation?.maxFiles || 0),
        10
      ),
      compress: process.env.LOG_ROTATION_COMPRESS !== 'false',
    },
  };
}

/**
 * Merge partial configuration with defaults
 */
export function mergeLoggerConfig(partial: Partial<LoggerConfig>): LoggerConfig {
  return {
    ...DEFAULT_LOGGER_CONFIG,
    ...partial,
    rotation: {
      ...DEFAULT_LOGGER_CONFIG.rotation!,
      ...partial.rotation,
    },
  };
}
