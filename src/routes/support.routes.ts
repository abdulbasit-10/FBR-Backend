import { Router } from 'express';
import * as ctrl from '../controllers/support.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { uploadSupportAttachment } from '../middlewares/upload';
import { createTicketSchema, updateTicketSchema } from '../validators/support.validator';

const router = Router();

router.use(authenticate);

// Support tickets are visible to any authenticated user in the company.
router.get('/', ctrl.list);
router.get('/:uuid', ctrl.getOne);
router.post('/', validate(createTicketSchema), ctrl.create);
router.put('/:uuid', validate(updateTicketSchema), ctrl.update);
router.delete('/:uuid', ctrl.remove);
router.post('/:uuid/attachment', uploadSupportAttachment, ctrl.uploadAttachment);

export default router;
