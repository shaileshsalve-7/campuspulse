import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Feedback } from '../models/feedback.model.js';
import { recordAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
export async function createFeedback(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const feedback = await Feedback.create({ ...request.body, authorId: request.auth!.userId });
  await recordAudit({ actorId: request.auth!.userId, action: 'FEEDBACK_CREATED', entityType: 'Feedback', entityId: feedback._id.toString() });
  return sendSuccess(response, 201, 'Feedback submitted. Your identity will not be displayed publicly when anonymous feedback is selected.', { feedback });
}
export async function listFeedback(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const pagination = getPagination(request);
  const filter: Record<string, unknown> = adminRoles.has(request.auth!.role) ? {} : { authorId: request.auth!.userId };
  if (adminRoles.has(request.auth!.role) && request.query.status) filter.status = request.query.status;
  const [items, total] = await Promise.all([Feedback.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('authorId', 'firstName lastName email').lean(), Feedback.countDocuments(filter)]);
  const visible = items.map((item) => ({ ...item, authorId: item.isAnonymous && !adminRoles.has(request.auth!.role) ? undefined : item.authorId }));
  return sendSuccess(response, 200, 'Feedback retrieved.', pageResult(visible, total, pagination));
}
export async function respondToFeedback(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!adminRoles.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const feedback = await Feedback.findByIdAndUpdate(request.params.id, { response: request.body.response, status: 'RESPONDED', respondedById: request.auth!.userId, respondedAt: new Date() }, { new: true });
  if (!feedback) throw new ApiError(404, 'Feedback not found.', 'FEEDBACK_NOT_FOUND');
  await Promise.all([notify({ recipientId: feedback.authorId, type: 'FEEDBACK_RESPONSE', title: 'Your feedback received a response', body: feedback.subject, link: '/feedback' }), recordAudit({ actorId: request.auth!.userId, action: 'FEEDBACK_RESPONDED', entityType: 'Feedback', entityId: feedback._id.toString() })]);
  return sendSuccess(response, 200, 'Feedback response published.', { feedback });
}
