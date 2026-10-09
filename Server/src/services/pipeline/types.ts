import type { Kit } from '@prepforge/shared';

export interface GenerateKitInput {
  jd: string;
  companyUrl: string;
  days: number;
}

export type PipelineStep =
  | 'initializing'
  | 'researching'
  | 'generating'
  | 'validating'
  | 'complete';

export interface PipelineProgress {
  step: PipelineStep;
  progress: number;
}

export interface GenerateKitOptions {
  onProgress?: (
    progress: PipelineProgress,
  ) => Promise<void> | void;
}

export type GenerateKit = (
  input: GenerateKitInput,
  options?: GenerateKitOptions,
) => Promise<Kit>;