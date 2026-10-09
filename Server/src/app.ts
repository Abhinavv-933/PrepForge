import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './errors/errorHandler.js';
import authRouter from './auth/auth.routes.js';
import { notFound } from './middleware/notFound.js';
import healthRouter from './routes/health.js';
import kitRouter from './kits/kit.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/health', healthRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/kits', kitRouter);

  app.use(notFound);

  app.use(errorHandler);

  return app;
}
