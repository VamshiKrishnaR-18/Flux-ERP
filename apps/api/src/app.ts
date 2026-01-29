import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

// Imports from your new clean structure
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';

const app = express();

// 1. Security & Logging
app.use(helmet());
app.use(morgan('dev')); // Logs requests to console

// 2. Dynamic CORS (Allows both Port 5173 and 5174)
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

// 3. Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});

// 4. Documentation (Swagger) - FIXED TYPE ERROR
// We use "...swaggerUi.serve" (spread) to fix the TypeScript error
app.use('/api-docs', ...swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any); 

// 5. Module Routes
app.use('/auth', authRoutes);      // Handles /auth/login, /auth/register
app.use('/clients', clientRoutes); // Handles /clients (Get/Create)

export default app;