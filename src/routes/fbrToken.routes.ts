import { Router } from 'express';
import * as ctrl from '../controllers/fbrToken.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { upsertFbrTokenSchema } from '../validators/setting.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('fbrtoken.manage'), ctrl.list);
router.post('/', authorize('fbrtoken.manage'), validate(upsertFbrTokenSchema), ctrl.upsert);
router.delete('/:uuid', authorize('fbrtoken.manage'), ctrl.deactivate);

export default router;
