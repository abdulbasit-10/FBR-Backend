import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/AppError';
import * as notificationService from '../services/notification.service';

const requireUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const result = await notificationService.listUserNotifications(userId, {
    ...req.query,
    unreadOnly: req.query.unreadOnly === 'true',
  });
  return sendSuccess(res, result);
});

export const unread = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const count = await notificationService.unreadCount(userId);
  return sendSuccess(res, { count });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const n = await notificationService.markAsRead(req.params.uuid, userId);
  return sendSuccess(res, n, 'Marked as read');
});

export const markAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const count = await notificationService.markAllAsRead(userId);
  return sendSuccess(res, { count }, 'All marked as read');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  await notificationService.deleteNotification(req.params.uuid, userId);
  return sendSuccess(res, null, 'Notification deleted');
});
