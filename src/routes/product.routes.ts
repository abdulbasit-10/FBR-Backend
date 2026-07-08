import { Router } from 'express';
import * as ctrl from '../controllers/product.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('product.read'), ctrl.list);
router.get('/:uuid', authorize('product.read'), ctrl.getOne);
router.post('/', authorize('product.create'), validate(createProductSchema), ctrl.create);
router.put('/:uuid', authorize('product.update'), validate(updateProductSchema), ctrl.update);
router.delete('/:uuid', authorize('product.delete'), ctrl.remove);

export default router;
