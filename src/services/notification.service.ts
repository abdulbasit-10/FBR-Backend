import { Op } from 'sequelize';
import { Notification, NotificationCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

export const listUserNotifications = async (
  userId: number,
  params: PaginationParams & { unreadOnly?: boolean },
): Promise<PaginatedResult<Notification>> => {
  const { page, limit, offset } = normalisePagination(params);
  const where: Record<string, unknown> = { userId };
  if (params.unreadOnly) where.isRead = false;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const create = async (data: NotificationCreationAttributes): Promise<Notification> =>
  Notification.create(data);

export const markAsRead = async (uuid: string, userId: number): Promise<Notification> => {
  const n = await Notification.findOne({ where: { uuid, userId } });
  if (!n) throw new NotFoundError('Notification not found');
  n.isRead = true;
  n.readAt = new Date();
  await n.save();
  return n;
};

export const markAllAsRead = async (userId: number): Promise<number> => {
  const [count] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } },
  );
  return count;
};

export const deleteNotification = async (uuid: string, userId: number): Promise<void> => {
  const n = await Notification.findOne({ where: { uuid, userId } });
  if (!n) throw new NotFoundError('Notification not found');
  await n.destroy();
};

export const unreadCount = async (userId: number): Promise<number> =>
  Notification.count({ where: { userId, isRead: false } });

export const purgeOld = async (days = 90): Promise<number> => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return Notification.destroy({ where: { createdAt: { [Op.lt]: cutoff }, isRead: true } });
};
