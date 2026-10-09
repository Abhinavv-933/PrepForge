import { z } from 'zod';

export const batchCaseSchema = z.object({
  id: z.string().min(1),
  jd: z.string(),
  company_url: z.url(),
  days: z.number().int().min(1).max(30),
});

export const batchInputSchema = z.array(batchCaseSchema);

export type ValidatedBatchCase = z.infer<typeof batchCaseSchema>;
