import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import invoiceRoutes from './invoice.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import lookupRoutes from './lookup.routes';
import userRoutes from './user.routes';
import settingRoutes from './setting.routes';
import notificationRoutes from './notification.routes';
import apiLogRoutes from './apiLog.routes';
import fbrTokenRoutes from './fbrToken.routes';

const router = Router();

/**
 * Central API router. Each module owns its own file; this file only wires them
 * under the API prefix. Modules mirror the backend spec:
 *   1. Auth              -> /auth
 *   2. Companies         -> /companies
 *   3. Customers         -> /customers
 *   4. Products          -> /products
 *   5. Invoices          -> /invoices (+ /:uuid/submit for FBR integration)
 *   6. Dashboard         -> /dashboard
 *   7. Reports           -> /reports
 *   8. FBR Integration   -> handled inside /invoices/:uuid/submit + /fbr-tokens
 *   9. Lookup            -> /lookup (proxies + local cache of FBR ref data)
 *   10-11. API Logs      -> /api-logs
 *   12. Error handling   -> global middleware (errorHandler)
 *   13. Security         -> helmet, rate-limit, JWT, bcrypt (see app.ts)
 *   14. Queue System     -> in-process, wired inside invoice.service
 *   15. Swagger          -> /docs (mounted in app.ts)
 * Plus support: Users/Roles/Permissions, Settings, Notifications.
 */
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/lookup', lookupRoutes);
router.use('/admin', userRoutes); // users, roles, permissions
router.use('/settings', settingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/api-logs', apiLogRoutes);
router.use('/fbr-tokens', fbrTokenRoutes);

export default router;
