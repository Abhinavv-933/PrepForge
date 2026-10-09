import { createHash } from 'node:crypto';

import { Types } from 'mongoose';

import { AppError } from '../errors/AppError.js';
import { KitModel } from '../models/kit.model.js';
import type { CreateKitInput } from './kit.schema.js';

function normalizeInput(input: CreateKitInput): string {
  return JSON.stringify({
    jd: input.jd.trim(),
    companyUrl: input.companyUrl.trim().toLowerCase(),
    days: input.days,
  });
}

export function createInputHash(input: CreateKitInput): string {
  return createHash('sha256').update(normalizeInput(input)).digest('hex');
}

function assertObjectId(userId: string): void {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, 'INVALID_USER', 'Authenticated user is invalid.');
  }
}

export async function createKit(userId: string, input: CreateKitInput) {
  assertObjectId(userId);

  const inputHash = createInputHash(input);

  const existingKit = await KitModel.findOne({
    userId,
    inputHash,
  });

  if (existingKit) {
    return {
      kit: existingKit,
      duplicate: true,
    };
  }

  try {
    const kit = await KitModel.create({
      userId,
      inputHash,
      input: {
        jd: input.jd.trim(),
        companyUrl: input.companyUrl.trim(),
        days: input.days,
      },
      generation: {
        status: 'queued',
        step: 'queued',
        progress: 0,
        error: null,
      },
    });

    return {
      kit,
      duplicate: false,
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      const existingKit = await KitModel.findOne({
        userId,
        inputHash,
      });

      if (existingKit) {
        return {
          kit: existingKit,
          duplicate: true,
        };
      }
    }

    throw error;
  }
}

export async function listKits(userId: string) {
  assertObjectId(userId);

  return KitModel.find({ userId })
    .sort({ createdAt: -1 })
    .select(
      '_id input.companyUrl input.days generation.status generation.step generation.progress createdAt updatedAt',
    )
    .lean();
}

export async function getKit(userId: string, kitId: string) {
  assertObjectId(userId);

  if (!Types.ObjectId.isValid(kitId)) {
    throw new AppError(400, 'INVALID_KIT_ID', 'Kit ID is invalid.');
  }

  const kit = await KitModel.findOne({
    _id: kitId,
    userId,
  });

  if (!kit) {
    throw new AppError(404, 'KIT_NOT_FOUND', 'Kit not found.');
  }

  return kit;
}

export async function deleteKit(userId: string, kitId: string): Promise<void> {
  assertObjectId(userId);

  if (!Types.ObjectId.isValid(kitId)) {
    throw new AppError(400, 'INVALID_KIT_ID', 'Kit ID is invalid.');
  }

  const result = await KitModel.deleteOne({
    _id: kitId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'KIT_NOT_FOUND', 'Kit not found.');
  }
}
