import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize, authorizeAny } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createRoleSchema,
  createUserSchema,
  resetUserPasswordSchema,
  updateRoleSchema,
  updateUserSchema,
} from '../validators/user.validator';

const router = Router();

router.use(authenticate);

// Users
router.get('/users', authorize('user.read'), ctrl.listUsers);
router.get('/users/:uuid', authorize('user.read'), ctrl.getUser);
router.post('/users', authorize('user.create'), validate(createUserSchema), ctrl.createUser);
router.put('/users/:uuid', authorize('user.update'), validate(updateUserSchema), ctrl.updateUser);
router.delete('/users/:uuid', authorize('user.delete'), ctrl.deleteUser);
router.post(
  '/users/:uuid/reset-password',
  authorize('user.update'),
  validate(resetUserPasswordSchema),
  ctrl.resetPassword,
);

// Roles & Permissions
// Listing roles is needed by anyone who can create/update team members (to pick a role for
// them) — creating/editing/deleting roles themselves stays restricted to role.manage.
router.get('/roles', authorizeAny('role.manage', 'user.create', 'user.update'), ctrl.listRoles);
router.get('/roles/:uuid', authorize('role.manage'), ctrl.getRole);
router.post('/roles', authorize('role.manage'), validate(createRoleSchema), ctrl.createRole);
router.put('/roles/:uuid', authorize('role.manage'), validate(updateRoleSchema), ctrl.updateRole);
router.delete('/roles/:uuid', authorize('role.manage'), ctrl.deleteRole);
router.get('/permissions', authorize('role.manage'), ctrl.listPermissions);

export default router;
