import type { Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Department } from '../models/department.model.js';
import { Issue } from '../models/issue.model.js';
import { recordAudit } from '../services/audit.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const admins = new Set(['ADMIN', 'SUPER_ADMIN']);
export async function listDepartments(_request: AuthenticatedRequest, response: Response): Promise<Response> {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
  return sendSuccess(response, 200, 'Departments retrieved.', { departments });
}
export async function createDepartment(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const department = await Department.create(request.body);
  await recordAudit({ actorId: request.auth!.userId, action: 'DEPARTMENT_CREATED', entityType: 'Department', entityId: department._id.toString() });
  return sendSuccess(response, 201, 'Department created.', { department });
}
export async function departmentPerformance(request: AuthenticatedRequest, response: Response): Promise<Response> {
  if (!admins.has(request.auth!.role)) throw new ApiError(403, 'Administrator access is required.', 'INSUFFICIENT_ROLE');
  const departments = await Department.aggregate([{ $lookup: { from: 'issues', localField: '_id', foreignField: 'departmentId', as: 'issues' } }, { $project: { name: 1, code: 1, assignedIssues: { $size: '$issues' }, resolvedIssues: { $size: { $filter: { input: '$issues', as: 'issue', cond: { $eq: ['$$issue.status', 'RESOLVED'] } } } }, pendingIssues: { $size: { $filter: { input: '$issues', as: 'issue', cond: { $ne: ['$$issue.status', 'RESOLVED'] } } } }, averageResolutionTimeHours: { $avg: { $map: { input: { $filter: { input: '$issues', as: 'issue', cond: { $and: [{ $eq: ['$$issue.status', 'RESOLVED'] }, { $ne: ['$$issue.resolvedAt', null] }] } } }, as: 'issue', in: { $divide: [{ $subtract: ['$$issue.resolvedAt', '$$issue.createdAt'] }, 3600000] } } } } } }]).exec();
  return sendSuccess(response, 200, 'Department performance retrieved.', { departments });
}
