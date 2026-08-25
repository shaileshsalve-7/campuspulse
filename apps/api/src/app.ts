import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { mongoSanitize } from './middleware/mongo-sanitize.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { issueRouter } from './routes/issue.routes.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { eventRouter } from './routes/event.routes.js';
import { clubRouter } from './routes/club.routes.js';
import { announcementRouter } from './routes/announcement.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { departmentRouter } from './routes/department.routes.js';
import { moderationRouter } from './routes/moderation.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { searchRouter } from './routes/search.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', (_request, response) => response.status(200).json({ success: true, message: 'CampusPulse API is healthy.', data: { status: 'ok' } }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: env.NODE_ENV === 'production' ? 20 : 200, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter);
app.use('/api/issues', issueRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/events', eventRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/search', searchRouter);

app.use(notFound);
app.use(errorHandler);
