import {
  kitSchema,
  type Kit,
} from '@prepforge/shared';

import type {
  GenerateKitInput,
  GenerateKitOptions,
} from './types.js';

async function reportProgress(
  options: GenerateKitOptions,
  step: Parameters<
    NonNullable<GenerateKitOptions['onProgress']>
  >[0],
): Promise<void> {
  await options.onProgress?.(step);
}

function createStubKit(
  input: GenerateKitInput,
): Kit {
  const now = new Date().toISOString();

  return {
    source: {
      company: '',
      company_url: input.companyUrl,
      role: '',
      location: '',
      jd_chars: input.jd.length,
      researched_at: now,
      pages_used: [],
      notes: [],
    },

    company_brief: {
      summary: '',
      what_they_do: '',
      sources: [],
    },

    role: {
      title: '',
      seniority: '',
      responsibilities: [],
      requirements: [],
    },

    questions: [],

    flashcards: [],

    schedule: {
      days_available: input.days,
      days: Array.from(
        { length: input.days },
        (_, index) => ({
          day: index + 1,
          focus: '',
          question_ids: [],
          minutes: 0,
        }),
      ),
    },

    coverage: {
      uncovered_requirement_ids: [],
      passes: 0,
    },
  };
}

export async function generateKit(
  input: GenerateKitInput,
  options: GenerateKitOptions = {},
): Promise<Kit> {
  await reportProgress(options, {
    step: 'initializing',
    progress: 0,
  });

  /*
   * TODO: Implement the real pipeline stages in later steps:
   *
   * 1. Extract requirements from the JD.
   * 2. Research the company website.
   * 3. Discover hiring/interview information.
   * 4. Generate questions by requirement/category.
   * 5. Generate flashcards.
   * 6. Run deterministic coverage checking.
   * 7. Run deterministic schedule allocation.
   * 8. Validate the final kit.
   */

  await reportProgress(options, {
    step: 'researching',
    progress: 20,
  });

  const stubKit = createStubKit(input);

  await reportProgress(options, {
    step: 'generating',
    progress: 50,
  });

  await reportProgress(options, {
    step: 'validating',
    progress: 80,
  });

  const validatedKit = kitSchema.parse(stubKit);

  await reportProgress(options, {
    step: 'complete',
    progress: 100,
  });

  return validatedKit;
}