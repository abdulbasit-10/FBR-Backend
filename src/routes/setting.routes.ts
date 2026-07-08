import { Router } from 'express';
import * as ctrl from '../controllers/setting.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { upsertSettingSchema } from '../validators/setting.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('company.read'), ctrl.list);
router.post('/', authorize('company.update'), validate(upsertSettingSchema), ctrl.upsert);
router.delete('/:uuid', authorize('company.update'), ctrl.remove);

export default router;
