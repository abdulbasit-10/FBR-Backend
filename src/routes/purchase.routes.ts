import { Router } from 'express';
import * as ctrl from '../controllers/purchase.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createPurchaseSchema,
  purchaseListQuery,
  updatePurchaseSchema,
} from '../validators/purchase.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('purchase.read'), validate(purchaseListQuery, 'query'), ctrl.list);
router.get('/:uuid', authorize('purchase.read'), ctrl.getOne);
router.post('/', authorize('purchase.create'), validate(createPurchaseSchema), ctrl.create);
router.put('/:uuid', authorize('purchase.update'), validate(updatePurchaseSchema), ctrl.update);
router.post('/:uuid/post', authorize('purchase.post'), ctrl.post);
router.post('/:uuid/cancel', authorize('purchase.cancel'), ctrl.cancel);
router.delete('/:uuid', authorize('purchase.cancel'), ctrl.remove);

export default router;
