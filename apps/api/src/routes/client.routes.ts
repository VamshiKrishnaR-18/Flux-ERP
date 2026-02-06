import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();

router.use(authMiddleware); // Protect all client routes

router.get('/', ClientController.getAll);
router.get('/export/csv', ClientController.exportCsv);
router.get('/:id', ClientController.getOne); // ✅ Add Get One
router.post('/', ClientController.create);
router.post('/:id/portal-token', ClientController.portalToken);
router.put('/:id', ClientController.update);
router.delete('/:id', ClientController.delete);

export default router;