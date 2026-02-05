import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', QuoteController.getAll);
	router.get('/export/csv', QuoteController.exportCsv);
router.post('/', QuoteController.create);
router.get('/:id', QuoteController.getOne);
	router.patch('/:id/status', QuoteController.updateStatus);
router.post('/:id/convert', QuoteController.convertToInvoice); // 👈 The Magic Button
router.delete('/:id', QuoteController.delete);
router.post('/:id/send', QuoteController.send);

export default router;