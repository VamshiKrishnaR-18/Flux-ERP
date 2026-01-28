import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { TestSchema } from '@erp/types'; // Importing from our shared monorepo package!

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  // We use the shared Zod schema to validate response structure (simulated here)
  const data = { message: "Hello from Serverless ERP!", status: 200 };
  const validation = TestSchema.safeParse(data);

  if (validation.success) {
    res.json({
      success: true,
      data: validation.data,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ error: "Internal Type Mismatch" });
  }
});

export default app;