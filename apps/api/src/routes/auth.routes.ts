import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.post('/logout', AuthController.logout);

router.post('/forgotpassword', AuthController.forgotPassword);
router.put('/resetpassword/:resetToken', AuthController.resetPassword);

router.post('/change-password', authMiddleware, AuthController.changePassword);

router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/dashboard-config', authMiddleware, AuthController.updateDashboardConfig);
router.get('/me', authMiddleware, AuthController.getMe);

export default router;