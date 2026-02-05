import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware'; // Ensure you import your auth middleware

const router = Router();

router.use(authMiddleware); // Protect all routes

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getOne);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

export default router;
