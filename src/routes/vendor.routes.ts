import { Router } from 'express';
import * as ctrl from '../controllers/vendor.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createVendorSchema, updateVendorSchema } from '../validators/vendor.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('vendor.read'), ctrl.list);
router.get('/:uuid', authorize('vendor.read'), ctrl.getOne);
router.post('/', authorize('vendor.create'), validate(createVendorSchema), ctrl.create);
router.put('/:uuid', authorize('vendor.update'), validate(updateVendorSchema), ctrl.update);
router.delete('/:uuid', authorize('vendor.delete'), ctrl.remove);

export default router;
