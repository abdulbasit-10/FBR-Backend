import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { changePasswordSchema, loginSchema, refreshSchema } from '../validators/auth.validator';

const router = Router();

/**
 * Aggressive rate limit on login / refresh to slow down brute-force
 * and credential-stuffing attacks. Tuned per-window per-IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// ---------- Public routes ----------
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/refresh', authLimiter, validate(refreshSchema), auth.refresh);

// ---------- Protected routes ----------
router.post('/logout', authenticate, auth.logout);
router.post('/logout-all', authenticate, auth.logoutAll);
router.get('/me', authenticate, auth.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), auth.changePassword);

export default router;
