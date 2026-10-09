import { Router } from 'express';

import { env } from '../config/env.js';
import { authRateLimit } from '../middleware/authRateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { getUserById, loginUser, registerUser } from './auth.service.js';

const router = Router();

const COOKIE_NAME = 'prepforge_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
};

router.post('/register', authRateLimit, validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    res.cookie(COOKIE_NAME, result.token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authRateLimit, validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.cookie(COOKIE_NAME, result.token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);

  res.status(204).send();
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    const user = await getUserById(req.user.id);

    res.json({
      user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
