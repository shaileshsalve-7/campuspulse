import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Club } from '../models/club.model.js';
import { ClubMember } from '../models/club-member.model.js';
import { Event } from '../models/event.model.js';
import { Announcement } from '../models/announcement.model.js';
import { recordAudit } from '../services/audit.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const managers = new Set(['CLUB_COORDINATOR', 'ADMIN', 'SUPER_ADMIN']);
const admins = new Set(['ADMIN', 'SUPER_ADMIN']);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function listClubs(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const pagination = getPagination(request);
  const filter: Record<string, unknown> = { isActive: true };
  if (request.query.category) filter.category = request.query.category;
  if (request.query.search) filter.$text = { $search: String(request.query.search) };
  const [items, total] = await Promise.all([Club.find(filter).sort({ followerCount: -1, name: 1 }).skip(pagination.skip).limit(pagination.limit).populate('coordinatorId', 'firstName lastName').lean(), Club.countDocuments(filter)]);
  return sendSuccess(response, 200, 'Clubs retrieved.', pageResult(items, total, pagination));
}
export async function getClub(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const club = await Club.findOne({ $or: [{ _id: request.params.id }, { slug: request.params.id }] }).populate('coordinatorId', 'firstName lastName').lean();
  if (!club) throw new ApiError(404, 'Club not found.', 'CLUB_NOT_FOUND');
  const [upcomingEvents, announcements, follows] = await Promise.all([Event.find({ clubId: club._id, date: { $gte: new Date() } }).sort({ date: 1 }).limit(5).lean(), Announcement.find({ isPublished: true, expiryDate: { $not: { $lt: new Date() } } }).sort({ publishDate: -1 }).limit(5).lean(), ClubMember.exists({ clubId: club._id, userId: request.auth!.userId })]);
  return sendSuccess(response, 200, 'Club retrieved.', { club: { ...club, isFollowing: Boolean(follows) }, upcomingEvents, announcements });
}
export async function createClub(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!managers.has(request.auth!.role)) throw new ApiError(403, 'You are not authorized to create clubs.', 'INSUFFICIENT_ROLE');
  const slug = slugify(request.body.name);
  if (!slug) throw new ApiError(422, 'Club name must include letters or numbers.', 'INVALID_CLUB_NAME');
  const club = await Club.create({ ...request.body, slug, coordinatorId: request.auth!.userId });
  await recordAudit({ actorId: request.auth!.userId, action: 'CLUB_CREATED', entityType: 'Club', entityId: club._id.toString() });
  return sendSuccess(response, 201, 'Club created.', { club });
}
export async function updateClub(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const club = await Club.findById(request.params.id);
  if (!club) throw new ApiError(404, 'Club not found.', 'CLUB_NOT_FOUND');
  if (!admins.has(request.auth!.role) && club.coordinatorId.toString() !== request.auth!.userId) throw new ApiError(403, 'You cannot edit this club.', 'CLUB_UPDATE_FORBIDDEN');
  for (const field of ['name', 'logoUrl', 'description', 'category', 'socialLinks', 'isActive'] as const) if (request.body[field] !== undefined) (club as unknown as Record<string, unknown>)[field] = request.body[field];
  if (request.body.name) club.slug = slugify(request.body.name);
  await club.save();
  await recordAudit({ actorId: request.auth!.userId, action: 'CLUB_UPDATED', entityType: 'Club', entityId: club._id.toString() });
  return sendSuccess(response, 200, 'Club updated.', { club });
}
export async function followClub(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const club = await Club.findById(request.params.id);
  if (!club || !club.isActive) throw new ApiError(404, 'Club not found.', 'CLUB_NOT_FOUND');
  try { await ClubMember.create({ clubId: club._id, userId: request.auth!.userId }); } catch (error: unknown) { if ((error as { code?: number }).code === 11000) throw new ApiError(409, 'You already follow this club.', 'DUPLICATE_MEMBERSHIP'); throw error; }
  const updated = await Club.findByIdAndUpdate(club._id, { $inc: { followerCount: 1 } }, { new: true }).select('followerCount');
  return sendSuccess(response, 201, 'You are now following this club.', { followerCount: updated?.followerCount ?? 0 });
}
export async function unfollowClub(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const membership = await ClubMember.findOneAndDelete({ clubId: request.params.id, userId: request.auth!.userId });
  if (!membership) throw new ApiError(404, 'You do not follow this club.', 'MEMBERSHIP_NOT_FOUND');
  const updated = await Club.findByIdAndUpdate(request.params.id, { $inc: { followerCount: -1 } }, { new: true }).select('followerCount');
  return sendSuccess(response, 200, 'You no longer follow this club.', { followerCount: Math.max(0, updated?.followerCount ?? 0) });
}
