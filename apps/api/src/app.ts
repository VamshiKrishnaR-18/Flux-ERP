import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { config } from './config/env';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import productRoutes from './routes/product.routes';
import expenseRoutes from './routes/expense.routes';
import quoteRoutes from './routes/quote.routes';
import publicRoutes from './routes/public.routes';
import reportsRoutes from './routes/reports.routes';
import healthRoutes from './routes/health.routes';
import activityRoutes from './routes/activity.routes';
import currencyRoutes from './routes/currency.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
import aiRoutes from './routes/ai.routes';

// Middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requireAdmin } from './middleware/admin.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';

const app = express();

// TRUST PROXY - Required for rate limiting behind API Gateway/Load Balancers
app.set('trust proxy', 1);

// REQUEST ID
app.use(requestIdMiddleware);

// CORS - Move to top and make more robust
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'https://flux-erp-web.vercel.app',
      ...(config.corsOrigin || []),
      /^https:\/\/.*\.vercel\.app$/
    ];

    const isAllowed = allowedOrigins.some(rule => {
      if (rule instanceof RegExp) return rule.test(origin);
      return rule === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204
}));

// SECURITY HEADERS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// LOGGING
morgan.token('requestId', (req: any) => req.requestId);
const morganFormat = ':requestId :method :url :status :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      const parts = message.split(' ');
      const logObject = {
        requestId: parts[0],
        method: parts[1],
        url: parts[2],
        status: parts[3],
        responseTime: parts[4],
      };
      logger.http(JSON.stringify(logObject));
    },
  },
}));

// BODY PARSING
app.use(express.json());
app.use(cookieParser() as unknown as RequestHandler);

// Serve uploads - Only if the directory exists to avoid errors in serverless environments
import fs from 'fs';
import path from 'path';
const uploadsDir = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static('uploads'));
}

// SECURITY SANITIZATION
app.use(mongoSanitize() as unknown as RequestHandler);
app.use(hpp() as unknown as RequestHandler);

// RATE LIMITING
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
  message: "Too many requests, please try again later."
});
app.use(limiter as unknown as RequestHandler);

// CACHE CONTROL
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});

// Swagger Docs
app.use('/api-docs', ...(swaggerUi.serve as unknown as RequestHandler[]), swaggerUi.setup(swaggerSpec) as unknown as RequestHandler);

// API V1 Router
const apiV1 = express.Router();

// Health Check (Public)
apiV1.use('/health', healthRoutes);

// Public Routes
apiV1.use('/auth', authRoutes);
apiV1.use('/public', publicRoutes);

// Protected Routes
apiV1.use('/clients', authMiddleware as unknown as RequestHandler, clientRoutes);
apiV1.use('/invoices', authMiddleware as unknown as RequestHandler, invoiceRoutes);
apiV1.use('/dashboard', authMiddleware as unknown as RequestHandler, dashboardRoutes);
apiV1.use('/products', authMiddleware as unknown as RequestHandler, productRoutes);
apiV1.use('/quotes', authMiddleware as unknown as RequestHandler, quoteRoutes);

// ADMIN & ANALYTICS ROUTES
apiV1.use('/expenses',
  authMiddleware as unknown as RequestHandler,
  requireAdmin as unknown as RequestHandler,
  expenseRoutes
);

apiV1.use('/reports',
  authMiddleware as unknown as RequestHandler,
  requireAdmin as unknown as RequestHandler,
  reportsRoutes
);

apiV1.use('/activity',
  authMiddleware as unknown as RequestHandler,
  activityRoutes
);

apiV1.use('/currency',
  authMiddleware as unknown as RequestHandler,
  currencyRoutes
);

apiV1.use('/settings',
  authMiddleware as unknown as RequestHandler,
  settingsRoutes
);

apiV1.use('/upload',
  authMiddleware as unknown as RequestHandler,
  uploadRoutes
);

apiV1.use('/ai', aiRoutes);

apiV1.use('/users', userRoutes);

// Mount API V1
app.use('/api/v1', apiV1);

// Global Error Handler
app.use(errorHandler as unknown as RequestHandler);

export default app;