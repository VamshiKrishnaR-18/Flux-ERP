import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', ExpenseController.getAll);
	router.get('/export/csv', ExpenseController.exportCsv);
router.post('/', ExpenseController.create);
router.delete('/:id', ExpenseController.delete);

export default router;