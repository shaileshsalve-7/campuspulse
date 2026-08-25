import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Event } from '../models/event.model.js';
import { EventRegistration } from '../models/event-registration.model.js';
import { Club } from '../models/club.model.js';
import { recordAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const eventManagers = new Set(['CLUB_COORDINATOR', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']);
const admins = new Set(['ADMIN', 'SUPER_ADMIN']);
async function canManageEvent(request: AuthenticatedRequest, event: { organizerId: { toString(): string } }) {
  return admins.has(request.auth!.role) || event.organizerId.toString() === request.auth!.userId;
}

export async function listEvents(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const pagination = getPagination(request);
  const filter: Record<string, unknown> = { date: { $gte: new Date() } };
  if (request.query.includePast === 'true') delete filter.date;
  if (request.query.category) filter.category = request.query.category;
  if (request.query.search) filter.$text = { $search: String(request.query.search) };
  const [items, total] = await Promise.all([Event.find(filter).sort({ date: 1 }).skip(pagination.skip).limit(pagination.limit).populate('organizerId', 'firstName lastName').populate('clubId', 'name slug logoUrl').lean(), Event.countDocuments(filter)]);
  return sendSuccess(response, 200, 'Events retrieved.', pageResult(items, total, pagination));
}

export async function getEvent(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const event = await Event.findById(request.params.id).populate('organizerId', 'firstName lastName').populate('clubId', 'name slug logoUrl').lean();
  if (!event) throw new ApiError(404, 'Event not found.', 'EVENT_NOT_FOUND');
  const registration = await EventRegistration.exists({ eventId: event._id, userId: request.auth!.userId });
  return sendSuccess(response, 200, 'Event retrieved.', { event: { ...event, isRegistered: Boolean(registration), spacesRemaining: Math.max(0, event.registrationLimit - event.registrationCount) } });
}

export async function createEvent(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!eventManagers.has(request.auth!.role)) throw new ApiError(403, 'You are not authorized to create events.', 'INSUFFICIENT_ROLE');
  const payload = { ...request.body, organizerId: request.auth!.userId };
  if (payload.clubId && request.auth!.role === 'CLUB_COORDINATOR') {
    const club = await Club.findOne({ _id: payload.clubId, coordinatorId: request.auth!.userId });
    if (!club) throw new ApiError(403, 'You may only create events for clubs you coordinate.', 'CLUB_MANAGEMENT_FORBIDDEN');
  }
  const event = await Event.create(payload);
  await recordAudit({ actorId: request.auth!.userId, action: 'EVENT_CREATED', entityType: 'Event', entityId: event._id.toString() });
  return sendSuccess(response, 201, 'Event created.', { event });
}

export async function updateEvent(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const event = await Event.findById(request.params.id);
  if (!event) throw new ApiError(404, 'Event not found.', 'EVENT_NOT_FOUND');
  if (!(await canManageEvent(request, event))) throw new ApiError(403, 'You cannot edit this event.', 'EVENT_UPDATE_FORBIDDEN');
  const allowed = ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'imageUrl', 'category', 'registrationLimit'] as const;
  const updates = Object.fromEntries(allowed.filter((field) => request.body[field] !== undefined).map((field) => [field, request.body[field]]));
  event.set(updates);
  if (event.registrationLimit < event.registrationCount) throw new ApiError(422, 'Registration limit cannot be below current registrations.', 'INVALID_CAPACITY');
  await event.save();
  await recordAudit({ actorId: request.auth!.userId, action: 'EVENT_UPDATED', entityType: 'Event', entityId: event._id.toString() });
  return sendSuccess(response, 200, 'Event updated.', { event });
}

export async function registerForEvent(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const duplicate = await EventRegistration.exists({ eventId: request.params.id, userId: request.auth!.userId });
  if (duplicate) throw new ApiError(409, 'You are already registered for this event.', 'DUPLICATE_REGISTRATION');
  const event = await Event.findOneAndUpdate({ _id: request.params.id, $expr: { $lt: ['$registrationCount', '$registrationLimit'] } }, { $inc: { registrationCount: 1 } }, { new: true });
  if (!event) throw new ApiError(409, 'This event is full or unavailable.', 'EVENT_FULL');
  try { await EventRegistration.create({ eventId: event._id, userId: request.auth!.userId }); } catch (error: unknown) { await Event.updateOne({ _id: event._id }, { $inc: { registrationCount: -1 } }); if ((error as { code?: number }).code === 11000) throw new ApiError(409, 'You are already registered for this event.', 'DUPLICATE_REGISTRATION'); throw error; }
  await Promise.all([notify({ recipientId: request.auth!.userId, type: 'EVENT_REGISTRATION', title: 'Event registration confirmed', body: event.title, link: `/events/${event._id}` }), recordAudit({ actorId: request.auth!.userId, action: 'EVENT_REGISTERED', entityType: 'Event', entityId: event._id.toString() })]);
  return sendSuccess(response, 201, 'You are registered for this event.', { event });
}

export async function cancelEventRegistration(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const registration = await EventRegistration.findOneAndDelete({ eventId: request.params.id, userId: request.auth!.userId });
  if (!registration) throw new ApiError(404, 'No registration was found.', 'REGISTRATION_NOT_FOUND');
  await Event.updateOne({ _id: request.params.id, registrationCount: { $gt: 0 } }, { $inc: { registrationCount: -1 } });
  await recordAudit({ actorId: request.auth!.userId, action: 'EVENT_REGISTRATION_CANCELLED', entityType: 'Event', entityId: String(request.params.id) });
  return sendSuccess(response, 200, 'Your registration was cancelled.');
}
