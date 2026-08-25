import { z } from 'zod';
import { ANNOUNCEMENT_PRIORITIES } from '../models/announcement.model.js';
import { EVENT_CATEGORIES } from '../models/event.model.js';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../models/issue.model.js';
import { REPORT_STATUSES, REPORT_TARGETS } from '../models/report.model.js';

const id = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid identifier.');
const url = z.string().url().max(2000);
const date = z.coerce.date();
const optionalDate = z.union([z.coerce.date(), z.null()]).optional();
const pagination = { page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional() };

const issuePayload = z.object({ title: z.string().trim().min(5).max(150), description: z.string().trim().min(15).max(5000), category: z.enum(ISSUE_CATEGORIES), priority: z.enum(ISSUE_PRIORITIES).default('MEDIUM'), location: z.object({ name: z.string().trim().min(2).max(120), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).optional() }), imageUrls: z.array(url).max(5).default([]), isAnonymous: z.boolean().default(false) });
export const createIssueSchema = z.object({ body: issuePayload.extend({ skipDuplicateCheck: z.boolean().optional() }) });
export const duplicateIssueSchema = z.object({ body: issuePayload.pick({ title: true, description: true, category: true }) });
export const updateIssueSchema = z.object({ body: issuePayload.partial().extend({ status: z.enum(ISSUE_STATUSES).optional(), departmentId: id.nullish(), assigneeId: id.nullish(), note: z.string().trim().max(1000).optional() }) });
export const issueListSchema = z.object({ body: z.any().optional(), query: z.object({ ...pagination, category: z.enum(ISSUE_CATEGORIES).optional(), priority: z.enum(ISSUE_PRIORITIES).optional(), status: z.enum(ISSUE_STATUSES).optional(), departmentId: id.optional(), mine: z.enum(['true', 'false']).optional(), sort: z.enum(['recent', 'trending']).optional(), search: z.string().max(100).optional() }) });

export const feedbackSchema = z.object({ body: z.object({ subject: z.string().trim().min(3).max(150), message: z.string().trim().min(10).max(5000), category: z.string().trim().max(80).optional(), isAnonymous: z.boolean().default(true) }) });
export const feedbackResponseSchema = z.object({ body: z.object({ response: z.string().trim().min(2).max(3000) }) });

const eventPayload = z.object({ title: z.string().trim().min(3).max(150), description: z.string().trim().min(10).max(5000), clubId: id.optional(), date, startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), location: z.string().trim().min(2).max(150), imageUrl: url.optional(), category: z.enum(EVENT_CATEGORIES), registrationLimit: z.coerce.number().int().min(1).max(100000) });
export const createEventSchema = z.object({ body: eventPayload });
export const updateEventSchema = z.object({ body: eventPayload.partial() });
export const eventListSchema = z.object({ body: z.any().optional(), query: z.object({ ...pagination, category: z.enum(EVENT_CATEGORIES).optional(), includePast: z.enum(['true', 'false']).optional(), search: z.string().max(100).optional() }) });

const clubPayload = z.object({ name: z.string().trim().min(3).max(100), logoUrl: url.optional(), description: z.string().trim().min(10).max(3000), category: z.string().trim().min(2).max(80), socialLinks: z.object({ website: url.optional(), instagram: url.optional(), linkedin: url.optional() }).default({}) });
export const createClubSchema = z.object({ body: clubPayload });
export const updateClubSchema = z.object({ body: clubPayload.partial().extend({ isActive: z.boolean().optional() }) });

const announcementPayload = z.object({ title: z.string().trim().min(3).max(180), content: z.string().trim().min(10).max(10000), priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('NORMAL'), attachmentUrl: url.optional(), publishDate: date.optional(), expiryDate: optionalDate, isPublished: z.boolean().optional() });
export const createAnnouncementSchema = z.object({ body: announcementPayload });
export const updateAnnouncementSchema = z.object({ body: announcementPayload.partial() });

export const departmentSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(20), description: z.string().trim().max(500).optional(), managerId: id.optional() }) });
export const reportSchema = z.object({ body: z.object({ targetType: z.enum(REPORT_TARGETS), targetId: id, reason: z.string().trim().min(3).max(150), details: z.string().trim().max(1000).optional() }) });
export const reportReviewSchema = z.object({ body: z.object({ status: z.enum(REPORT_STATUSES).exclude(['PENDING']), reviewNote: z.string().trim().max(1000).optional() }) });
export const userUpdateSchema = z.object({ body: z.object({ role: z.enum(['STUDENT', 'FACULTY', 'CLUB_COORDINATOR', 'ADMIN', 'SUPER_ADMIN']).optional(), isActive: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, 'No user changes provided.') });
