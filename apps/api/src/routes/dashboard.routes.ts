import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', DashboardController.getStats);
router.get('/drilldown', DashboardController.getDrilldown);
router.get('/search', DashboardController.search);

export default router;
