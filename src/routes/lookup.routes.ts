import { Router } from 'express';
import * as ctrl from '../controllers/lookup.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);

// Read from local cache (dropdowns for FE)
router.get('/provinces', ctrl.provinces);
router.get('/doc-types', ctrl.docTypes);
router.get('/hs-codes', ctrl.hsCodes);
router.get('/uoms', ctrl.uoms);
router.get('/transaction-types', ctrl.transactionTypes);
router.get('/sros', ctrl.sros);
router.get('/rates', ctrl.rates);

// Live proxy — no cache
router.get('/registration-type', ctrl.registrationType);

// Sync operations (admin)
router.post('/sync', authorize('reference.sync'), ctrl.syncAll);
router.post('/sync/:kind', authorize('reference.sync'), ctrl.syncOne);

export default router;
