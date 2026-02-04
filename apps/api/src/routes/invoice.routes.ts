import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth.middleware'; // ✅ Import this

const router = Router();

// Apply authMiddleware to ALL invoice routes to be safe
router.use(authMiddleware); 

// Routes
router.get('/', InvoiceController.getAll);
router.get('/:id', InvoiceController.getOne);

// ✅ Create must be protected so 'req.user' exists
router.post('/', InvoiceController.create); 

router.put('/:id', InvoiceController.update);
router.delete('/:id', InvoiceController.delete);
router.post('/:id/payment', InvoiceController.addPayment);

// Send Invoice (Mock Email)
router.post('/:id/send', InvoiceController.send);

export default router;