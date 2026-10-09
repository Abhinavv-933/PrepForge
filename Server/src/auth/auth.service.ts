import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { UserModel } from '../models/User.js';
import type { LoginInput, RegisterInput } from './auth.schema.ts';

const SALT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
}

function createToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new AppError(
      409,
      'EMAIL_ALREADY_REGISTERED',
      'An account with this email already exists.',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await UserModel.create({
    email,
    passwordHash,
  });

  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
  };

  return {
    user: authUser,
    token: createToken(authUser),
  };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase();

  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
  };

  return {
    user: authUser,
    token: createToken(authUser),
  };
}

export async function getUserById(userId: string) {
  const user = await UserModel.findById(userId).select('_id email');

  if (!user) {
    throw new AppError(401, 'USER_NOT_FOUND', 'Authenticated user no longer exists.');
  }

  return {
    id: user._id.toString(),
    email: user.email,
  };
}
