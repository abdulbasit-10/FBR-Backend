import { Router } from 'express';
import * as ctrl from '../controllers/company.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize, requireRole } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createCompanySchema, updateCompanySchema } from '../validators/company.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('company.read'), ctrl.list);
router.get('/:uuid', authorize('company.read'), ctrl.getOne);
router.post('/', requireRole('SuperAdmin'), validate(createCompanySchema), ctrl.create);
router.put('/:uuid', authorize('company.update'), validate(updateCompanySchema), ctrl.update);
router.delete('/:uuid', requireRole('SuperAdmin'), ctrl.remove);

export default router;
