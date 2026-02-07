import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();


router.use(authMiddleware); 


router.get('/', InvoiceController.getAll);
router.get('/export/csv', InvoiceController.exportCsv);
router.get('/:id', InvoiceController.getOne);


router.post('/', InvoiceController.create); 

router.put('/:id', InvoiceController.update);
router.delete('/:id', InvoiceController.delete);
router.post('/:id/payment', InvoiceController.addPayment);


router.post('/:id/send', InvoiceController.send);

export default router;