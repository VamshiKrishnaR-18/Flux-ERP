import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { config } from './config/env'; // ✅ Use Config

// ✅ Routes
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes'; 
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import productRoutes from './routes/product.routes';
import expenseRoutes from './routes/expense.routes';
import quoteRoutes from './routes/quote.routes';
import publicRoutes from './routes/public.routes';
import repairRoutes from './routes/repair.routes';

// ✅ Middleware (Import directly)
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware'; 

const app = express();

// --- 1. Global Middleware ---
app.use(helmet());
app.use(morgan('dev')); 
app.use(express.json());

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

// Utilities
app.use('/repair', repairRoutes);

// --- 3. Global Error Handler (MUST BE LAST) ---
app.use(errorHandler);

export default app;