import type { RequestHandler } from 'express';

import { AppError } from '../errors/AppError.js';

export const notFound: RequestHandler = (req) => {
  throw new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`);
};
