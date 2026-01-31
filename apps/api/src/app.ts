import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes'; 
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import productRoutes from './routes/product.routes';
import expenseRoutes from './routes/expense.routes';
import quoteRoutes from './routes/quote.routes';

// ✅ FIX: Import from './middleware' (which reads index.ts) and alias it to 'authenticate'
import { authMiddleware as authenticate } from './middleware'; 

const app = express();

// Security & Logging
app.use(helmet());
app.use(morgan('dev')); 

// CORS
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Prevent Caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});

// Documentation
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any); 

// Module Routes
app.use('/auth', authRoutes);      
app.use('/clients', authenticate, clientRoutes); 
app.use('/invoices', authenticate, invoiceRoutes); 
app.use('/dashboard', authenticate, dashboardRoutes);
app.use('/settings', authenticate, settingsRoutes);
app.use('/products', authenticate, productRoutes);

// ✅ Routes without '/api' prefix to match frontend
app.use('/expenses', authenticate, expenseRoutes);
app.use('/quotes', authenticate, quoteRoutes);


export default app;