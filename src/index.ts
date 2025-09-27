import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createWriteStream } from 'fs';
import { join } from 'path';

import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import env from './config/env';

const app = express();

// Trust proxy for ngrok and other reverse proxies /remove this if you are not using ngrok
app.set('trust proxy', true);

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');
try {
  require('fs').mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory already exists or other error
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Rate limiting (exclude webhooks from rate limiting)
app.use('/api', apiLimiter);

// Webhook routes BEFORE body parsing (need raw body)
app.use('/webhooks', require('./routes/webhooks').default);

// Body parsing middleware for non-webhook routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Debug routes endpoint
app.get('/debug/routes', (req, res) => {
  const routes: Array<{ path: string; methods: string[] }> = [];
  
  // Get all registered routes
  function extractRoutes(stack: any[], prefix: string = '') {
    stack.forEach((layer: any) => {
      if (layer.route) {
        // Terminal route
        const path = prefix + layer.route.path;
        const methods = Object.keys(layer.route.methods);
        routes.push({ path, methods });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware, dive deeper
        const routerPrefix = layer.regexp.source
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '')
          .replace(/[()\\^$]/g, '')
          .replace(/\\\//g, '/');
        extractRoutes(layer.handle.stack, routerPrefix);
      }
    });
  }
  
  extractRoutes((app as any)._router.stack);
  
  res.status(200).json({
    success: true,
    message: 'Available routes',
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use(routes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  });
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${env.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
