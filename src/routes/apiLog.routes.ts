import { Router } from 'express';
import * as ctrl from '../controllers/apiLog.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);

router.get('/', authorize('apilog.view'), ctrl.list);
router.get('/errors', authorize('apilog.view'), ctrl.errors);
router.get('/:uuid', authorize('apilog.view'), ctrl.getOne);

export default router;
