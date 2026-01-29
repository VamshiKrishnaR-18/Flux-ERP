import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
// FIX: Correct Import Path and Name 👇
import { authMiddleware } from '../middleware/index'; 

const router = Router();

// Protect all invoice routes
router.use(authMiddleware);

router.get('/', InvoiceController.getAll);
router.post('/', InvoiceController.create);
router.get('/:id', InvoiceController.getOne);
router.put('/:id', InvoiceController.update);
router.delete('/:id', InvoiceController.delete);

export default router;