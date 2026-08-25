import { Router } from 'express';
import * as controller from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createIssueSchema, duplicateIssueSchema, issueListSchema, updateIssueSchema } from '../validators/campus.validator.js';

export const issueRouter = Router();
issueRouter.use(requireAuth);
issueRouter.get('/', validate(issueListSchema), asyncHandler(controller.listIssues));
issueRouter.get('/map', asyncHandler(controller.issueMap));
issueRouter.post('/similar', validate(duplicateIssueSchema), asyncHandler(controller.findDuplicates));
issueRouter.post('/', validate(createIssueSchema), asyncHandler(controller.createIssue));
issueRouter.get('/:id', asyncHandler(controller.getIssue));
issueRouter.patch('/:id', validate(updateIssueSchema), asyncHandler(controller.updateIssue));
issueRouter.delete('/:id', asyncHandler(controller.removeIssue));
issueRouter.post('/:id/vote', asyncHandler(controller.voteForIssue));
issueRouter.delete('/:id/vote', asyncHandler(controller.removeVote));
