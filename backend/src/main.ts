import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { createWinstonLogger } from './common/logger/winston.config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    const configService = app.get(ConfigService);

    // Setup Winston Logger
    const logger = createWinstonLogger(configService);
    app.useLogger(logger);

    // Cookie Parser (required for httpOnly JWT cookies)
    app.use(cookieParser());

    // Environment check
    const isDevelopment = configService.get('nodeEnv') === 'development';

    // CORS Configuration (MUST be before Helmet to prevent header conflicts)
    const corsOrigin = configService.get('cors.origin');
    logger.log(`CORS Origin: ${corsOrigin}`, 'Bootstrap');

    // Parse CORS origins (support comma-separated string or array)
    const allowedOrigins = typeof corsOrigin === 'string'
      ? corsOrigin.split(',').map(o => o.trim())
      : Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];

    // Helper function to check if origin matches (supports wildcards)
    const isOriginAllowed = (origin: string): boolean => {
      return allowedOrigins.some(allowedOrigin => {
        // Exact match
        if (allowedOrigin === origin) return true;

        // Wildcard match (e.g., https://*.vercel.app)
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
            .replace(/\*/g, '.*'); // Replace * with .*
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }

        return false;
      });
    };

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, Postman)
        if (!origin) return callback(null, true);

        // Check if origin is allowed (supports wildcards)
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          logger.warn(`Blocked CORS request from origin: ${origin}`, 'CORS');
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With'],
      exposedHeaders: ['set-cookie'],
      maxAge: 3600, // Cache preflight requests for 1 hour
    });

    logger.log('CORS configured successfully', 'Bootstrap');

    // Security Headers - Helmet middleware
    // Защищает приложение от известных веб-уязвимостей через установку HTTP заголовков

    app.use(helmet({
      // Content Security Policy - защита от XSS и injection атак
      contentSecurityPolicy: isDevelopment ? false : {
        directives: {
          defaultSrc: ["'self'"], // По умолчанию загружать ресурсы только с того же origin
          scriptSrc: ["'self'", "'unsafe-inline'"], // Разрешить inline скрипты для Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'"], // Разрешить inline стили для Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'], // Разрешить изображения с https и data URLs
          fontSrc: ["'self'", 'data:'], // Разрешить шрифты
          connectSrc: ["'self'"], // Разрешить AJAX запросы только к своему API
          frameSrc: ["'none'"], // Запретить embedding в frames (защита от clickjacking)
          objectSrc: ["'none'"], // Запретить <object>, <embed>, <applet>
        },
      },
      // HTTP Strict Transport Security - только для production (требует HTTPS)
      hsts: isDevelopment ? false : {
        maxAge: 31536000, // 1 год в секундах
        includeSubDomains: true, // Применять HSTS ко всем поддоменам
        preload: true, // Разрешить включение в HSTS preload список браузеров
      },
      // X-Frame-Options - защита от clickjacking атак
      frameguard: {
        action: 'deny', // Полностью запрещаем отображение сайта во фреймах
      },
      // X-Content-Type-Options - защита от MIME type sniffing
      noSniff: true, // Браузер не должен пытаться угадать MIME type файлов
      // X-XSS-Protection - защита от XSS (устаревший, но все еще полезный)
      xssFilter: true, // Включить встроенную защиту браузера от XSS
      // Referrer-Policy - контролирует передачу referrer информации
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin', // Отправлять полный referrer только на тот же origin
      },
      // Hide X-Powered-By header - не раскрываем технологию сервера
      hidePoweredBy: true,
    }));

    logger.log(`Helmet configured for ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`, 'Bootstrap');

    // Global prefix (MUST be set before CSRF middleware)
    app.setGlobalPrefix('api');

    // CSRF Protection (after prefix, before routes)
    const csrfSecret = configService.get('csrf.secret');
    const csrfUtilities = doubleCsrf({
      getSecret: () => csrfSecret,
      // Use simple cookie name in dev (HTTP), simple name in production (cross-origin doesn't support __Host-)
      // __Host- prefix requires secure=true + same-origin, but we need cross-origin (Vercel + Railway)
      cookieName: 'x-csrf-token',
      cookieOptions: {
        // Use 'lax' in dev, 'none' in production for cross-origin (Vercel frontend + Railway backend)
        sameSite: isDevelopment ? 'lax' : 'none',
        path: '/',
        secure: !isDevelopment, // HTTPS only in production
        httpOnly: false, // Allow JavaScript to read cookie for double-submit pattern (required by csrf-csrf)
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
      getSessionIdentifier: (req) => req.headers['user-agent'] || 'unknown', // Use user-agent as session identifier
    });

    const { doubleCsrfProtection, generateCsrfToken } = csrfUtilities;

    // Apply CSRF protection globally, except for specific routes
    app.use((req: any, res: any, next: any) => {
      // Skip CSRF for OPTIONS requests (CORS preflight)
      if (req.method === 'OPTIONS') {
        return next();
      }

      // Exclude webhook endpoints from CSRF protection
      // Note: CSRF middleware runs AFTER globalPrefix, so paths include /api prefix
      const excludedPaths = [
        '/api/payments/webhook',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify-email',
        '/api/auth/resend-code',
        '/api/auth/csrf-token',  // Endpoint to get CSRF token
        '/api/health',           // Health check endpoints
        '/api/api-docs',         // Swagger docs
        '/api/docs',             // Swagger docs
        '/api/advertisements/impression', // Advertisement impression tracking (partial match)
        '/api/users/verify-all/emails',  // Admin bulk email verification (JWT protected)
        '/api/users/force-delete',       // Emergency force delete (Secret protected)
      ];

      if (
        excludedPaths.some((path) => req.path.startsWith(path)) ||
        // Exclude advertisement impression tracking (has dynamic ID: /api/advertisements/:id/impression)
        (req.path.startsWith('/api/advertisements/') && req.path.endsWith('/impression'))
      ) {
        return next();
      }

      // Debug: Log CSRF-protected requests in development
      if (isDevelopment) {
        logger.debug?.(`CSRF check: ${req.method} ${req.path}`, 'CSRF');

        // Log CSRF token details for POST/PUT/DELETE/PATCH requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
          const cookieToken = req.cookies?.['x-csrf-token'];
          const headerToken = req.headers['x-csrf-token'];
          logger.debug?.(`CSRF Token - Cookie: ${cookieToken?.substring(0, 20)}..., Header: ${headerToken?.substring(0, 20)}...`, 'CSRF');
        }
      }

      // Apply CSRF protection
      doubleCsrfProtection(req, res, next);
    });

    // Store generateCsrfToken for use in controllers (access underlying Express instance)
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.csrfTokenGenerator = generateCsrfToken;

    logger.log('CSRF protection configured', 'Bootstrap');

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('MNU Events API')
      .setDescription('University Events Management Platform API')
      .setVersion('1.0')
      .addTag('Authentication', 'Auth endpoints (register, login, verify email)')
      .addTag('Users', 'User management endpoints')
      .addTag('Events', 'Event management endpoints')
      .addTag('Registrations', 'Event registration endpoints')
      .addTag('Clubs', 'Club management endpoints')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    const port = configService.get('port') || 3001;
    const host = '0.0.0.0'; // Слушаем на всех интерфейсах для доступности через localhost и 127.0.0.1

    logger.log(`Starting server on ${host}:${port}...`, 'Bootstrap');
    logger.log(`Environment: ${configService.get('nodeEnv')}`, 'Bootstrap');
    logger.log(`Database URL: ${configService.get('database.url') ? 'configured' : 'NOT CONFIGURED'}`, 'Bootstrap');

    await app.listen(port, host);

    logger.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🎓 MNU Events API Server                               ║
  ║                                                          ║
  ║   Server running on: http://localhost:${port}           ║
  ║   Server running on: http://127.0.0.1:${port}          ║
  ║   API Documentation: http://localhost:${port}/api/docs  ║
  ║   Environment: ${configService.get('nodeEnv')}                       ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `, 'Bootstrap');

    logger.log(`✅ Server successfully started and listening on ${host}:${port}`, 'Bootstrap');
  } catch (error) {
    const standaloneLogger = require('./common/logger/winston.config').createStandaloneLogger();
    standaloneLogger.error('❌ Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      context: 'Bootstrap',
    });

    if (error instanceof Error) {
      standaloneLogger.error('Error details', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: 'Bootstrap',
      });

      // Проверяем типичные ошибки
      if (error.message?.includes('EADDRINUSE')) {
        standaloneLogger.error('Port is already in use. Please stop the process using port 3001 or change PORT in .env', { context: 'Bootstrap' });
      } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('database')) {
        standaloneLogger.error('Database connection failed. Make sure PostgreSQL is running: docker-compose up -d', { context: 'Bootstrap' });
      }
    }

    process.exit(1);
  }
}

bootstrap();
