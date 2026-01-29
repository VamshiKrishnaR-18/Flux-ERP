import { Router, Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { ClientSchema } from '@erp/types';
import { authMiddleware } from '../middleware/index';

const router = Router();

/**
 * @swagger
 * tags:
 * name: Clients
 * description: CRM Client management
 */

/**
 * @swagger
 * /clients:
 * get:
 * summary: Retrieve a list of all clients
 * tags: [Clients]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of clients
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * 401:
 * description: Unauthorized (Token missing or invalid)
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clients = await ClientModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch clients" });
  }
});

/**
 * @swagger
 * /clients:
 * post:
 * summary: Create a new client
 * tags: [Clients]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, email]
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * format: email
 * companyName:
 * type: string
 * responses:
 * 201:
 * description: Client created successfully
 * 409:
 * description: Client with this email already exists
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const validation = ClientSchema.safeParse(req.body);
  
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  try {
    const existingClient = await ClientModel.findOne({ email: validation.data.email });
    if (existingClient) {
      res.status(409).json({ success: false, message: "Client with this email already exists" });
      return;
    }

    const newClient = await ClientModel.create(validation.data);
    res.status(201).json({ success: true, message: "Client created successfully", data: newClient });

  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;