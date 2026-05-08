import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authMiddleware);

router.get('/', ProductController.getAll);
router.post('/import', upload.single('file') as any, ProductController.bulkImport as any);
router.post('/', ProductController.create);
router.get('/:id', ProductController.getOne);
router.patch('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

export default router;
