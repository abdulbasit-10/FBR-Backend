import { Router } from 'express';
import * as ctrl from '../controllers/fbrToken.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { upsertFbrTokenSchema } from '../validators/setting.validator';

const router = Router();

router.use(authenticate);

// FBR tokens are recorded and rotated by the platform SuperAdmin only (per the
// Developer Guide: "Super Admin creates companies, records their tokens, and
// moves them from Sandbox to Production") — not self-service by CompanyAdmin.
router.get('/', requireRole('SuperAdmin'), ctrl.list);
router.post('/', requireRole('SuperAdmin'), validate(upsertFbrTokenSchema), ctrl.upsert);
router.delete('/:uuid', requireRole('SuperAdmin'), ctrl.deactivate);

export default router;
