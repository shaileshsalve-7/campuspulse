import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Issue } from '../models/issue.model.js';
import { IssueStatusHistory } from '../models/issue-status-history.model.js';
import { IssueVote } from '../models/issue-vote.model.js';
import { recordAudit } from '../services/audit.service.js';
import { findSimilarIssues } from '../services/issue-similarity.service.js';
import { notify } from '../services/notification.service.js';
import { getPagination, pageResult } from '../services/pagination.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';

const staffRoles = new Set(['FACULTY', 'ADMIN', 'SUPER_ADMIN']);
const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
const objectId = (value: string, label = 'id') => { if (!isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}.`, 'INVALID_ID'); return value; };

export async function listIssues(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const { page, limit, skip } = getPagination(request);
  const filters: Record<string, unknown> = {};
  for (const field of ['category', 'status', 'priority', 'departmentId'] as const) if (request.query[field]) filters[field] = request.query[field];
  if (request.query.mine === 'true') filters.reporterId = request.auth!.userId;
  if (request.query.search) filters.$text = { $search: String(request.query.search) };
  const sort: Record<string, 1 | -1> = request.query.sort === 'trending' ? { upvoteCount: -1, createdAt: -1 } : { createdAt: -1 };
  const [issues, total] = await Promise.all([Issue.find(filters).sort(sort).skip(skip).limit(limit).populate('departmentId', 'name code').populate('reporterId', 'firstName lastName').lean(), Issue.countDocuments(filters)]);
  return sendSuccess(response, 200, 'Issues retrieved.', pageResult(issues.map((issue) => ({ ...issue, reporterId: issue.isAnonymous ? undefined : issue.reporterId })), total, { page, limit, skip }));
}

export async function getIssue(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const id = objectId(String(request.params.id), 'issue id');
  const issue = await Issue.findById(id).populate('departmentId', 'name code').populate('reporterId', 'firstName lastName avatarUrl').populate('assigneeId', 'firstName lastName').lean();
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND');
  const [history, voted] = await Promise.all([IssueStatusHistory.find({ issueId: id }).sort({ createdAt: 1 }).populate('changedById', 'firstName lastName').lean(), IssueVote.exists({ issueId: id, userId: request.auth!.userId })]);
  return sendSuccess(response, 200, 'Issue retrieved.', { issue: { ...issue, reporterId: issue.isAnonymous ? undefined : issue.reporterId, hasVoted: Boolean(voted) }, history });
}

export async function findDuplicates(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const { title, description, category } = request.body;
  const similar = await findSimilarIssues({ title, description, category });
  return sendSuccess(response, 200, 'Similar issues evaluated.', { similar });
}

export async function createIssue(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const { title, description, category, priority, location, imageUrls, isAnonymous, skipDuplicateCheck } = request.body;
  if (!skipDuplicateCheck) {
    const similar = await findSimilarIssues({ title, description, category });
    if (similar.length) throw new ApiError(409, 'Potential duplicate reports found. You can upvote an existing issue instead.', 'POSSIBLE_DUPLICATES', { similar });
  }
  const issue = await Issue.create({ title, description, category, priority, location, imageUrls, isAnonymous, reporterId: request.auth!.userId });
  await Promise.all([IssueStatusHistory.create({ issueId: issue._id, toStatus: 'SUBMITTED', changedById: request.auth!.userId, note: 'Report submitted.' }), recordAudit({ actorId: request.auth!.userId, action: 'ISSUE_CREATED', entityType: 'Issue', entityId: issue._id.toString() })]);
  return sendSuccess(response, 201, 'Issue submitted successfully.', { issue });
}

export async function updateIssue(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const id = objectId(String(request.params.id), 'issue id');
  const issue = await Issue.findById(id);
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND');
  const isStaff = staffRoles.has(request.auth!.role);
  const isOwner = issue.reporterId.toString() === request.auth!.userId;
  if (!isOwner && !isStaff) throw new ApiError(403, 'Only the reporter or authorized campus staff may update this issue.', 'ISSUE_UPDATE_FORBIDDEN');
  const { title, description, category, priority, location, imageUrls, isAnonymous, status, departmentId, assigneeId, note } = request.body;
  if (!isStaff && (status || departmentId || assigneeId)) throw new ApiError(403, 'Only authorized campus staff may change workflow fields.', 'WORKFLOW_UPDATE_FORBIDDEN');
  if (title !== undefined) issue.title = title;
  if (description !== undefined) issue.description = description;
  if (category !== undefined) issue.category = category;
  if (priority !== undefined) issue.priority = priority;
  if (location !== undefined) issue.location = location;
  if (imageUrls !== undefined) issue.imageUrls = imageUrls;
  if (isAnonymous !== undefined) issue.isAnonymous = isAnonymous;
  if (departmentId !== undefined) issue.departmentId = departmentId || undefined;
  if (assigneeId !== undefined) issue.assigneeId = assigneeId || undefined;
  const oldStatus = issue.status;
  if (status && status !== oldStatus) {
    issue.status = status;
    issue.statusUpdatedAt = new Date();
    if (status === 'RESOLVED') issue.resolvedAt = new Date();
    if (status !== 'RESOLVED') issue.resolvedAt = undefined;
  }
  await issue.save();
  const backgroundWork: Promise<unknown>[] = [recordAudit({ actorId: request.auth!.userId, action: 'ISSUE_UPDATED', entityType: 'Issue', entityId: issue._id.toString(), metadata: { status: issue.status } })];
  if (oldStatus !== issue.status) {
    backgroundWork.push(IssueStatusHistory.create({ issueId: issue._id, fromStatus: oldStatus, toStatus: issue.status, changedById: request.auth!.userId, note }));
    backgroundWork.push(notify({ recipientId: issue.reporterId, type: 'ISSUE_STATUS', title: `Report status: ${issue.status.replaceAll('_', ' ')}`, body: issue.title, link: `/issues/${issue._id}` }));
  }
  if (assigneeId) backgroundWork.push(notify({ recipientId: assigneeId, type: 'ISSUE_ASSIGNMENT', title: 'New issue assigned to you', body: issue.title, link: `/issues/${issue._id}` }));
  await Promise.all(backgroundWork);
  return sendSuccess(response, 200, 'Issue updated.', { issue });
}

export async function removeIssue(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const id = objectId(String(request.params.id), 'issue id');
  const issue = await Issue.findById(id);
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND');
  const mayRemove = issue.reporterId.toString() === request.auth!.userId && issue.status === 'SUBMITTED' || adminRoles.has(request.auth!.role);
  if (!mayRemove) throw new ApiError(403, 'Only an administrator or the reporter before review may remove this issue.', 'ISSUE_DELETE_FORBIDDEN');
  await Promise.all([Issue.deleteOne({ _id: id }), IssueStatusHistory.deleteMany({ issueId: id }), IssueVote.deleteMany({ issueId: id }), recordAudit({ actorId: request.auth!.userId, action: 'ISSUE_DELETED', entityType: 'Issue', entityId: id })]);
  return sendSuccess(response, 200, 'Issue removed.');
}

export async function voteForIssue(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const id = objectId(String(request.params.id), 'issue id');
  const issue = await Issue.findById(id).select('reporterId title');
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND');
  if (issue.reporterId.toString() === request.auth!.userId) throw new ApiError(422, 'You cannot upvote your own issue.', 'SELF_VOTE_FORBIDDEN');
  try { await IssueVote.create({ issueId: id, userId: request.auth!.userId }); } catch (error: unknown) { if ((error as { code?: number }).code === 11000) throw new ApiError(409, 'You have already upvoted this issue.', 'DUPLICATE_VOTE'); throw error; }
  const updated = await Issue.findByIdAndUpdate(id, { $inc: { upvoteCount: 1 } }, { new: true }).select('upvoteCount');
  return sendSuccess(response, 201, 'Your upvote was recorded.', { upvoteCount: updated?.upvoteCount ?? 0 });
}

export async function removeVote(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const id = objectId(String(request.params.id), 'issue id');
  const vote = await IssueVote.findOneAndDelete({ issueId: id, userId: request.auth!.userId });
  if (!vote) throw new ApiError(404, 'No upvote was found for this issue.', 'VOTE_NOT_FOUND');
  const updated = await Issue.findByIdAndUpdate(id, { $inc: { upvoteCount: -1 } }, { new: true }).select('upvoteCount');
  return sendSuccess(response, 200, 'Your upvote was removed.', { upvoteCount: Math.max(0, updated?.upvoteCount ?? 0) });
}

export async function issueMap(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const filters: Record<string, unknown> = { 'location.coordinates.0': { $exists: true } };
  for (const field of ['category', 'status', 'priority'] as const) if (request.query[field]) filters[field] = request.query[field];
  const issues = await Issue.find(filters).select('title category priority status upvoteCount location').sort({ upvoteCount: -1 }).limit(500).lean();
  return sendSuccess(response, 200, 'Map issues retrieved.', { issues });
}
