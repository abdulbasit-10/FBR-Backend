import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';

import config from './config';
import { swaggerSpec } from './config/swagger';
import { httpLogger } from './middlewares/httpLogger';
import { apiLogger } from './middlewares/apiLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/apiResponse';
import routes from './routes';

const app: Application = express();

// ---------- Security & core middlewares ----------
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }),
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// ---------- Uploaded file access (support ticket attachments, etc.) ----------
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// ---------- Rate limiting ----------
app.use(
  config.apiPrefix,
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  }),
);

// ---------- Inbound API audit log (Module 11) ----------
app.use(apiLogger);

// ---------- Health check ----------
app.get('/health', (_req: Request, res: Response) =>
  sendSuccess(
    res,
    {
      status: 'ok',
      appName: config.appName,
      env: config.env,
      timestamp: new Date().toISOString(),
    },
    'Service is healthy',
    StatusCodes.OK,
  ),
);

// ---------- Swagger docs (Module 15) ----------
app.use(
  `${config.apiPrefix}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: `${config.appName} API Docs`,
  }),
);
app.get(`${config.apiPrefix}/docs.json`, (_req: Request, res: Response) => res.json(swaggerSpec));

// ---------- API routes ----------
app.use(config.apiPrefix, routes);

app.get(config.apiPrefix, (_req: Request, res: Response) =>
  sendSuccess(res, { version: 'v1', docs: `${config.apiPrefix}/docs` }, `${config.appName} API`),
);

// ---------- 404 + error handler (must be last) ----------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
