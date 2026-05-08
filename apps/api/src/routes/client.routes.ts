import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.use(authMiddleware);

router.get('/', ClientController.getAll);
router.get('/export/csv', ClientController.exportCsv);
router.post('/import', upload.single('file') as any, ClientController.bulkImport as any);
router.get('/:id', ClientController.getOne); 
router.get('/:id/portal', ClientController.portalToken);
router.post('/', ClientController.create);
router.patch('/:id', ClientController.update);
router.delete('/:id', ClientController.delete);

export default router;