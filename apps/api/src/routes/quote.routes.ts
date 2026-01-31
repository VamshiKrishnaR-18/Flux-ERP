import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authMiddleware } from '../middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', QuoteController.getAll);
router.post('/', QuoteController.create);
router.post('/:id/convert', QuoteController.convertToInvoice); // 👈 The Magic Button
router.delete('/:id', QuoteController.delete);
router.post('/:id/send', QuoteController.send);

export default router;