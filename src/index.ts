import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';

import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import env from './config/env';

const app = express();

app.set('trust proxy', env.TRUST_PROXY);

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');
const allowedOrigins = env.CORS_ORIGIN.map(normalizeOrigin);
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

if (env.NODE_ENV !== 'production') {
  app.get('/debug/routes', (req, res) => {
    const registeredRoutes: Array<{ path: string; methods: string[] }> = [];

    function extractRoutes(stack: any[], prefix: string = '') {
      stack.forEach((layer: any) => {
        if (layer.route) {
          registeredRoutes.push({
            path: prefix + layer.route.path,
            methods: Object.keys(layer.route.methods),
          });
        } else if (layer.name === 'router' && layer.handle.stack) {
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
      routes: registeredRoutes.sort((a, b) => a.path.localeCompare(b.path)),
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });
}

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
    corsOrigin: allowedOrigins,
  });
  
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
