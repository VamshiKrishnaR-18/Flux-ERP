import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/revenue-vs-expenses', ReportsController.getRevenueVsExpenses);
router.get('/expense-breakdown', ReportsController.getExpenseBreakdown);
router.get('/tax', ReportsController.getTaxReport);

export default router;
