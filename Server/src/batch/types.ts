import type { Kit } from '@prepforge/shared';

export interface BatchCase {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

export interface BatchError {
  code: string;
  message: string;
}

export interface BatchResult {
  id: string;
  status: 'ok' | 'failed';
  kit: Kit | null;
  error: BatchError | null;
}

export interface BatchOutput {
  version: '1.0';
  generated_at: string;
  kits: BatchResult[];
}
