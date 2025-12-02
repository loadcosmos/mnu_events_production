import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

/**
 * Winston Logger Configuration
 * Provides structured logging with different levels for development and production
 */
export const createWinstonLogger = (configService: ConfigService) => {
  const logLevel = configService.get<string>('LOG_LEVEL') || 'info';
  const logFileEnabled = configService.get<string>('LOG_FILE_ENABLED') === 'true';
  const logFilePath = configService.get<string>('LOG_FILE_PATH') || 'logs';
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  );

  // Console format for development (pretty print)
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('MNU Events', {
      colors: true,
      prettyPrint: true,
      processId: true,
      appName: true,
    }),
  );

  // Define transports
  const transports: winston.transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: nodeEnv === 'production' ? logFormat : consoleFormat,
    }),
  ];

  // File transports (optional, disabled by default in development)
  if (logFileEnabled) {
    // Error logs
    transports.push(
      new winston.transports.File({
        filename: `${logFilePath}/error.log`,
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );

    // Combined logs
    transports.push(
      new winston.transports.File({
        filename: `${logFilePath}/combined.log`,
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
      }),
    );

    // HTTP logs (access logs)
    transports.push(
      new winston.transports.File({
        filename: `${logFilePath}/http.log`,
        level: 'http',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exceptionHandlers: logFileEnabled
      ? [
          new winston.transports.File({
            filename: `${logFilePath}/exceptions.log`,
          }),
        ]
      : [],
    rejectionHandlers: logFileEnabled
      ? [
          new winston.transports.File({
            filename: `${logFilePath}/rejections.log`,
          }),
        ]
      : [],
  });
};

/**
 * Logger instance for use outside of NestJS dependency injection
 * Useful for bootstrap and configuration files
 */
export const createStandaloneLogger = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format:
          nodeEnv === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
              ),
      }),
    ],
  });
};
