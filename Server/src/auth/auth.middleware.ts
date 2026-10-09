import jwt, { type JwtPayload, type VerifyErrors } from 'jsonwebtoken';
import type { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { getUserById } from './auth.service.js';

interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
}

function isAuthTokenPayload(payload: string | JwtPayload): payload is AuthTokenPayload {
  return (
    typeof payload !== 'string' &&
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string'
  );
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.prepforge_token;

    if (!token) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
    }

    let payload: string | JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      const jwtError = error as VerifyErrors;

      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Authentication token has expired.');
      }

      throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid.');
    }

    if (!isAuthTokenPayload(payload)) {
      throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid.');
    }

    req.user = await getUserById(payload.sub);

    next();
  } catch (error) {
    next(error);
  }
};
