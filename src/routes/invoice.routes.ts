import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createInvoiceSchema,
  invoiceListQuery,
  submitInvoiceSchema,
  updateInvoiceSchema,
} from '../validators/invoice.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('invoice.read'), validate(invoiceListQuery, 'query'), ctrl.list);
router.get('/:uuid', authorize('invoice.read'), ctrl.getOne);
router.post('/', authorize('invoice.create'), validate(createInvoiceSchema), ctrl.create);
router.put('/:uuid', authorize('invoice.update'), validate(updateInvoiceSchema), ctrl.update);
router.delete('/:uuid', authorize('invoice.cancel'), ctrl.remove);

// Synchronous FBR call (validate = dry run, post = final)
router.post('/:uuid/submit', authorize('invoice.post'), validate(submitInvoiceSchema), ctrl.submit);
// Queue-backed submit (Module 14)
router.post('/:uuid/enqueue', authorize('invoice.post'), validate(submitInvoiceSchema), ctrl.enqueue);

export default router;
