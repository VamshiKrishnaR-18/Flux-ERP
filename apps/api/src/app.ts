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

// Middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requireAdmin } from './middleware/admin.middleware';

const app = express();


// SECURITY HEADERS
app.use(helmet());

// LOGGING
const morganFormat = ':method :url :status :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      const logObject = {
        method: message.split(' ')[0],
        url: message.split(' ')[1],
        status: message.split(' ')[2],
        responseTime: message.split(' ')[3],
      };
      logger.http(JSON.stringify(logObject));
    },
  },
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    
    const allowedOrigins = [
      'http://localhost:5173',                  
      'http://localhost:3000',                  
      /\.vercel\.app$/                          // Matches ANY Vercel deployment
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// BODY PARSING
app.use(express.json());
app.use(cookieParser() as unknown as RequestHandler);

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

// Public Routes
apiV1.use('/auth', authRoutes);
apiV1.use('/public', publicRoutes); 

// Protected Routes
apiV1.use('/clients', authMiddleware as unknown as RequestHandler, clientRoutes);
apiV1.use('/invoices', authMiddleware as unknown as RequestHandler, invoiceRoutes);
apiV1.use('/dashboard', authMiddleware as unknown as RequestHandler, dashboardRoutes);
apiV1.use('/products', authMiddleware as unknown as RequestHandler, productRoutes);
apiV1.use('/quotes', authMiddleware as unknown as RequestHandler, quoteRoutes);

// ADMIN ROUTES
apiV1.use('/expenses', 
  authMiddleware as unknown as RequestHandler, 
  requireAdmin as unknown as RequestHandler, 
  expenseRoutes
);


apiV1.use('/settings', 
  authMiddleware as unknown as RequestHandler, 
  requireAdmin as unknown as RequestHandler, 
  settingsRoutes
);

// Mount API V1
app.use('/api/v1', apiV1);

// Global Error Handler
app.use(errorHandler as unknown as RequestHandler);

export default app;