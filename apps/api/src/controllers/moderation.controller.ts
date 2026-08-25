import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Report } from '../models/report.model.js';
import { recordAudit } from '../services/audit.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const admins = new Set(['ADMIN', 'SUPER_ADMIN']);
export async function createReport(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const report = await Report.create({ ...request.body, reporterId: request.auth!.userId });
  await recordAudit({ actorId: request.auth!.userId, action: 'CONTENT_REPORTED', entityType: request.body.targetType, entityId: String(request.body.targetId), metadata: { reason: request.body.reason } });
  return sendSuccess(response, 201, 'Content report submitted for review.', { report });
}
export async function listReports(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const pagination = getPagination(request);
  const filter: Record<string, unknown> = request.query.status ? { status: request.query.status } : {};
  const [items, total] = await Promise.all([Report.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('reporterId', 'firstName lastName email').populate('reviewedById', 'firstName lastName').lean(), Report.countDocuments(filter)]);
  return sendSuccess(response, 200, 'Moderation reports retrieved.', pageResult(items, total, pagination));
}
export async function reviewReport(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const report = await Report.findByIdAndUpdate(request.params.id, { status: request.body.status, reviewNote: request.body.reviewNote, reviewedById: request.auth!.userId }, { new: true });
  if (!report) throw new ApiError(404, 'Content report not found.', 'REPORT_NOT_FOUND');
  await recordAudit({ actorId: request.auth!.userId, action: `REPORT_${report.status}`, entityType: 'Report', entityId: report._id.toString(), metadata: { targetType: report.targetType, targetId: report.targetId.toString() } });
  return sendSuccess(response, 200, 'Moderation decision recorded.', { report });
}
