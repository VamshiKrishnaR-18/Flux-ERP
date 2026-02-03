import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/index';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;