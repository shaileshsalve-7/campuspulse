import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Notification } from '../models/notification.model.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

export async function listNotifications(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const pagination = getPagination(request, 50);
  const filter: Record<string, unknown> = { recipientId: request.auth!.userId };
  if (request.query.state === 'UNREAD') filter.isRead = false;
  if (request.query.state === 'READ') filter.isRead = true;
  const [items, total, unreadCount] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(), Notification.countDocuments(filter), Notification.countDocuments({ recipientId: request.auth!.userId, isRead: false })]);
  return sendSuccess(response, 200, 'Notifications retrieved.', { ...pageResult(items, total, pagination), unreadCount });
}
export async function markNotificationRead(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const item = await Notification.findOneAndUpdate({ _id: request.params.id, recipientId: request.auth!.userId }, { isRead: true }, { new: true });
  if (!item) throw new ApiError(404, 'Notification not found.', 'NOTIFICATION_NOT_FOUND');
  return sendSuccess(response, 200, 'Notification marked as read.', { notification: item });
}
export async function markAllNotificationsRead(request: AuthenticatedRequest, response: Response): Promise<Response> {
  await Notification.updateMany({ recipientId: request.auth!.userId, isRead: false }, { isRead: true });
  return sendSuccess(response, 200, 'All notifications marked as read.');
}
