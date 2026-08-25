import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Announcement } from '../models/announcement.model.js';
import { Club } from '../models/club.model.js';
import { Event } from '../models/event.model.js';
import { Issue } from '../models/issue.model.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

export async function globalSearch(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const query = String(request.query.q ?? '').trim();
  if (query.length < 2) throw new ApiError(422, 'Search for at least two characters.', 'SEARCH_QUERY_TOO_SHORT');
  const text = { $text: { $search: query } };
  const [issues, events, clubs, announcements] = await Promise.all([
    Issue.find(text).select('title category priority status upvoteCount').sort({ score: { $meta: 'textScore' } }).limit(8).lean(),
    Event.find(text).select('title category date location').sort({ score: { $meta: 'textScore' } }).limit(8).lean(),
    Club.find({ ...text, isActive: true }).select('name slug category logoUrl followerCount').sort({ score: { $meta: 'textScore' } }).limit(8).lean(),
    Announcement.find({ ...text, isPublished: true }).select('title priority publishDate').sort({ score: { $meta: 'textScore' } }).limit(8).lean(),
  ]);
  return sendSuccess(response, 200, 'Search complete.', { issues, events, clubs, announcements });
}
