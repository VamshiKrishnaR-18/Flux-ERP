import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware); // Protect routes
router.get('/', SettingsController.get);
router.put('/', SettingsController.update);

export default router;