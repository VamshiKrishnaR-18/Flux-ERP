import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware'; // ✅ Import middleware

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// ✅ NEW: Logout Route (Protected optional, but good practice)
router.post('/logout', AuthController.logout);

// ✅ Forgot / Reset Password
router.post('/forgotpassword', AuthController.forgotPassword);
router.put('/resetpassword/:resetToken', AuthController.resetPassword);

// ✅ Change Password (Protected)
router.post('/change-password', authMiddleware, AuthController.changePassword);

// ✅ Update Profile (Protected)
router.put('/profile', authMiddleware, AuthController.updateProfile);

export default router;