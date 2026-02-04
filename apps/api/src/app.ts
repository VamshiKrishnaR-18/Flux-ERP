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

const app = express();

// --- 1. Global Middleware ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// ✅ FIX: Type Bridge for Cookie Parser
app.use(cookieParser() as unknown as RequestHandler);

// Security Middleware
// ✅ FIX: Type Bridge for Security libs
app.use(mongoSanitize() as unknown as RequestHandler);
app.use(hpp() as unknown as RequestHandler);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100, // Use 'limit' (standard) instead of 'max' (deprecated)
  message: "Too many requests, please try again later."
});

// ✅ FIX: Type Bridge for Rate Limiter
app.use(limiter as unknown as RequestHandler);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Prevent Caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// --- 2. Routes ---
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});

// ✅ FIX: Spread Operator for Swagger
app.use('/api-docs', ...(swaggerUi.serve as unknown as RequestHandler[]), swaggerUi.setup(swaggerSpec) as unknown as RequestHandler); 

// Public
app.use('/auth', authRoutes);
app.use('/public', publicRoutes);

// Protected Routes
app.use('/clients', authMiddleware, clientRoutes);
app.use('/invoices', authMiddleware, invoiceRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/settings', authMiddleware, settingsRoutes);
app.use('/products', authMiddleware, productRoutes);
app.use('/expenses', authMiddleware, expenseRoutes);
app.use('/quotes', authMiddleware, quoteRoutes);

// --- 3. Global Error Handler (MUST BE LAST) ---
app.use(errorHandler);

export default app;