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


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});

// Documentation
app.use('/api-docs', ...swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any); 

// Module Routes
app.use('/auth', authRoutes);      
app.use('/clients', clientRoutes); 
app.use('/invoices', invoiceRoutes); 
app.use('/dashboard', dashboardRoutes);
app.use('/settings', settingsRoutes);
app.use('/products', productRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/quotes', quoteRoutes);

export default app;