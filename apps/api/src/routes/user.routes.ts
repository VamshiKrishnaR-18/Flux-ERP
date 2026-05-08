import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All user management routes are admin only
router.use(authMiddleware as any);
router.use(requireAdmin as any);

router.get('/', UserController.getAll);
router.patch('/:id/role', UserController.updateRole);
router.delete('/:id', UserController.delete);

export default router;
