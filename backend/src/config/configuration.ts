export default () => {
  // SECURITY: Validate required secrets on startup
  const requiredSecrets = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'EMAIL_VERIFICATION_SECRET',
    'PAYMENT_SECRET',
    'CSRF_SECRET', // Added for CSRF protection
  ];

  const missingSecrets = requiredSecrets.filter(
    (secret) => !process.env[secret]
  );

  if (missingSecrets.length > 0) {
    throw new Error(
      `CRITICAL SECURITY ERROR: Missing required environment variables: ${missingSecrets.join(', ')}. ` +
      `Application cannot start without these secrets configured.`
    );
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    },
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    },
    emailVerification: {
      secret: process.env.EMAIL_VERIFICATION_SECRET,
      expiresIn: process.env.EMAIL_VERIFICATION_EXPIRATION || '24h',
    },
    payment: {
      secret: process.env.PAYMENT_SECRET,
    },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'noreply@mnuevents.kz',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
      uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    csrf: {
      secret: process.env.CSRF_SECRET,
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
      filePath: process.env.LOG_FILE_PATH || 'logs',
    },
  };
};
