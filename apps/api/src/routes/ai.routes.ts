import { Router } from 'express';
import { getDashboardInsights, askAssistant } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/insights', getDashboardInsights);
router.post('/ask', askAssistant);

export default router;
