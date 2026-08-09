import { Router } from 'express';
import * as ctrl from '../controllers/ledger.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);
router.get('/items', authorize('report.view'), ctrl.itemLedger);

export default router;
