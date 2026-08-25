import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Announcement } from '../models/announcement.model.js';
import { EventRegistration } from '../models/event-registration.model.js';
import { Feedback } from '../models/feedback.model.js';
import { Issue } from '../models/issue.model.js';
import { Report } from '../models/report.model.js';
import { User } from '../models/user.model.js';
import { aiService } from '../services/ai.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const admins = new Set(['ADMIN', 'SUPER_ADMIN']);
function rangeStart(period?: string): Date | undefined {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7d') return new Date(now.getTime() - 7 * 86400000);
  if (period === '30d') return new Date(now.getTime() - 30 * 86400000);
  if (period === 'semester') return new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
  return undefined;
}
export async function analytics(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const start = rangeStart(String(request.query.period ?? '30d'));
  const issueFilter = start ? { createdAt: { $gte: start } } : {};
  const [totalStudents, totalIssues, openIssues, resolvedIssues, resolutionTiming, issuesByCategory, issuesByDepartment, issuesByPriority, monthlyIssueTrends, eventRegistrations, feedbackStats, moderationPending] = await Promise.all([
    User.countDocuments({ role: 'STUDENT', isActive: true }),
    Issue.countDocuments(issueFilter),
    Issue.countDocuments({ ...issueFilter, status: { $nin: ['RESOLVED', 'REJECTED'] } }),
    Issue.countDocuments({ ...issueFilter, status: 'RESOLVED' }),
    Issue.aggregate([{ $match: { ...issueFilter, status: 'RESOLVED', resolvedAt: { $ne: null } } }, { $group: { _id: null, averageMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } }]),
    Issue.aggregate([{ $match: issueFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Issue.aggregate([{ $match: issueFilter }, { $group: { _id: '$departmentId', count: { $sum: 1 } } }, { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } }, { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$department.name', 0] }, 'Unassigned'] } } }, { $sort: { count: -1 } }]),
    Issue.aggregate([{ $match: issueFilter }, { $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Issue.aggregate([{ $match: issueFilter }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
    EventRegistration.countDocuments(start ? { createdAt: { $gte: start } } : {}),
    Feedback.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Report.countDocuments({ status: 'PENDING' }),
  ]);
  const averageResolutionTimeHours = Math.round(((resolutionTiming[0]?.averageMs ?? 0) / 3600000) * 10) / 10;
  const metrics = { totalStudents, totalIssues, openIssues, resolvedIssues, resolutionPercentage: totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0, averageResolutionTimeHours, eventRegistrations, moderationPending };
  const insights = await aiService.deriveAnalyticsInsights({ metrics });
  return sendSuccess(response, 200, 'Analytics retrieved.', { metrics, issuesByCategory, issuesByDepartment, issuesByPriority, monthlyIssueTrends, feedbackStats, insights });
}

export async function manageUsers(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const users = await User.find().select('firstName lastName email role isActive createdAt').sort({ createdAt: -1 }).limit(200).lean();
  return sendSuccess(response, 200, 'Users retrieved.', { users });
}

export async function updateUser(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  if (request.params.id === request.auth!.userId && request.body.isActive === false) throw new ApiError(422, 'You cannot disable your own account.', 'SELF_DISABLE_FORBIDDEN');
  const user = await User.findByIdAndUpdate(request.params.id, { $set: request.body }, { new: true }).select('firstName lastName email role isActive');
  if (!user) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
  return sendSuccess(response, 200, 'User updated.', { user });
}
