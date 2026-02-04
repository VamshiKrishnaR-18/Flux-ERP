import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();


router.get('/', SettingsController.get);


router.put('/', requireAdmin, SettingsController.update);

export default router;