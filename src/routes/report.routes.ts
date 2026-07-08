import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);
router.get('/daily', authorize('report.view'), ctrl.daily);
router.get('/monthly', authorize('report.view'), ctrl.monthly);
router.get('/tax', authorize('report.view'), ctrl.tax);
router.get('/sales', authorize('report.view'), ctrl.sales);

export default router;
