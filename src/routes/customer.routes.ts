import { Router } from 'express';
import * as ctrl from '../controllers/customer.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('customer.read'), ctrl.list);
router.get('/:uuid', authorize('customer.read'), ctrl.getOne);
router.post('/', authorize('customer.create'), validate(createCustomerSchema), ctrl.create);
router.put('/:uuid', authorize('customer.update'), validate(updateCustomerSchema), ctrl.update);
router.delete('/:uuid', authorize('customer.delete'), ctrl.remove);

export default router;
