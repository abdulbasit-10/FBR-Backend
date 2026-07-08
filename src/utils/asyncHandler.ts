import { NextFunction, Request, Response } from 'express';

/**
 * Wraps async controllers so thrown errors flow into the Express error handler.
 * Usage: router.get('/x', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler =
  <Req extends Request = Request, Res extends Response = Response>(
    fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Req, res: Res, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
