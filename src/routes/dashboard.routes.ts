import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);
router.get('/', authorize('report.view'), ctrl.get);

export default router;
