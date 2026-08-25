import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Announcement } from '../models/announcement.model.js';
import { User } from '../models/user.model.js';
import { recordAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const publishers = new Set(['FACULTY', 'ADMIN', 'SUPER_ADMIN']);
const admins = new Set(['ADMIN', 'SUPER_ADMIN']);

export async function listAnnouncements(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const pagination = getPagination(request);
  const now = new Date();
  const filter: Record<string, unknown> = { isPublished: true, $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: now } }] };
  if (publishers.has(request.auth!.role) && request.query.includeDrafts === 'true') delete filter.isPublished;
  if (request.query.search) filter.$text = { $search: String(request.query.search) };
  const [items, total] = await Promise.all([Announcement.find(filter).sort({ publishDate: -1 }).skip(pagination.skip).limit(pagination.limit).populate('authorId', 'firstName lastName role').lean(), Announcement.countDocuments(filter)]);
  return sendSuccess(response, 200, 'Announcements retrieved.', pageResult(items, total, pagination));
}

export async function createAnnouncement(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!publishers.has(request.auth!.role)) throw new ApiError(403, 'Only authorized faculty and administrators can publish announcements.', 'INSUFFICIENT_ROLE');
  const announcement = await Announcement.create({ ...request.body, authorId: request.auth!.userId });
  const recipients = await User.find({ isActive: true }).select('_id').lean();
  await Promise.all([recordAudit({ actorId: request.auth!.userId, action: 'ANNOUNCEMENT_CREATED', entityType: 'Announcement', entityId: announcement._id.toString() }), ...recipients.map((recipient) => notify({ recipientId: recipient._id, type: 'ANNOUNCEMENT', title: announcement.title, body: 'New official campus announcement', link: `/announcements/${announcement._id}` }))]);
  return sendSuccess(response, 201, 'Official announcement published.', { announcement });
}

export async function updateAnnouncement(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const announcement = await Announcement.findById(request.params.id);
  if (!announcement) throw new ApiError(404, 'Announcement not found.', 'ANNOUNCEMENT_NOT_FOUND');
  if (!admins.has(request.auth!.role) && announcement.authorId.toString() !== request.auth!.userId) throw new ApiError(403, 'You cannot edit this announcement.', 'ANNOUNCEMENT_UPDATE_FORBIDDEN');
  for (const field of ['title', 'content', 'priority', 'attachmentUrl', 'publishDate', 'expiryDate', 'isPublished'] as const) if (request.body[field] !== undefined) (announcement as unknown as Record<string, unknown>)[field] = request.body[field];
  await announcement.save();
  await recordAudit({ actorId: request.auth!.userId, action: 'ANNOUNCEMENT_UPDATED', entityType: 'Announcement', entityId: announcement._id.toString() });
  return sendSuccess(response, 200, 'Announcement updated.', { announcement });
}
