import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/unread-count', ctrl.unread);
router.post('/:uuid/read', ctrl.markRead);
router.post('/mark-all-read', ctrl.markAll);
router.delete('/:uuid', ctrl.remove);

export default router;
