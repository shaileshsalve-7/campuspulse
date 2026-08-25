import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
export const searchRouter = Router();
searchRouter.use(requireAuth);
searchRouter.get('/', asyncHandler(globalSearch));
