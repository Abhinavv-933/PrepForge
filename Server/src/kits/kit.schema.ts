import { z } from 'zod';

export const createKitSchema = z.object({
  jd: z.string().min(1).max(100_000),

  companyUrl: z.url(),

  days: z.number().int().min(1).max(30),
});

export type CreateKitInput = z.infer<typeof createKitSchema>;
