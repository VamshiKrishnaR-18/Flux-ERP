import express, { Request, Response } from 'express';
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

// ✅ FIX: Cast cookieParser to 'any' to fix the TypeScript error
app.use(cookieParser() as any);

// ✅ FIX: Cast others to 'any' as well
app.use(mongoSanitize() as any);
app.use(hpp() as any);

// Rate Limiting (100 requests per 10 mins)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." }
});

// ✅ FIX: Cast rate limiter to 'any'
app.use(limiter as any); 

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

app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any); 

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