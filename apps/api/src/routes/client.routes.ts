import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();

router.use(authMiddleware);

router.get('/', ClientController.getAll);
router.get('/export/csv', ClientController.exportCsv);
router.get('/:id', ClientController.getOne); 
router.post('/', ClientController.create);
router.post('/:id/portal-token', ClientController.portalToken);
router.put('/:id', ClientController.update);
router.delete('/:id', ClientController.delete);

export default router;