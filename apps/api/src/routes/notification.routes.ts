import { Router } from 'express';
import * as controller from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get('/', asyncHandler(controller.listNotifications));
notificationRouter.patch('/read-all', asyncHandler(controller.markAllNotificationsRead));
notificationRouter.patch('/:id/read', asyncHandler(controller.markNotificationRead));
