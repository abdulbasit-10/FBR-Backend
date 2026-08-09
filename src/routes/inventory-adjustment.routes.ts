import { Router } from 'express';
import * as ctrl from '../controllers/inventory-adjustment.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  adjustmentListQuery,
  createAdjustmentSchema,
} from '../validators/inventory-adjustment.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('inventory.read'), validate(adjustmentListQuery, 'query'), ctrl.list);
router.get('/:uuid', authorize('inventory.read'), ctrl.getOne);
router.post('/', authorize('inventory.create'), validate(createAdjustmentSchema), ctrl.create);
router.post('/:uuid/post', authorize('inventory.post'), ctrl.post);
router.post('/:uuid/cancel', authorize('inventory.cancel'), ctrl.cancel);
router.delete('/:uuid', authorize('inventory.cancel'), ctrl.remove);

export default router;
