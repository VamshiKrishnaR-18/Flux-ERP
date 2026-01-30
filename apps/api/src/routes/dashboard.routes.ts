import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/index';

const router = Router();

router.use(authMiddleware);
router.get('/', DashboardController.getStats);

export default router;