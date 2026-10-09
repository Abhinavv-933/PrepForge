import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { batchInputSchema } from './schemas.js';
import type { BatchCase, BatchError, BatchOutput, BatchResult } from './types.js';
import { generateKit } from '../services/pipeline/generatekit.js';

const CONCURRENCY = 2;

function parseArgs(argv: string[]): {
  input: string;
  output: string;
} {
  const normalizedArgs = argv.filter((arg) => arg !== '--' && !arg.startsWith('--'));

  const inputIndex = argv.indexOf('--input');
  const outputIndex = argv.indexOf('--output');

  // Standard npm invocation:
  // npm run evaluate -- --input cases.json --output kits.json
  if (inputIndex !== -1 && outputIndex !== -1) {
    const input = argv[inputIndex + 1];
    const output = argv[outputIndex + 1];

    if (input && output) {
      return { input, output };
    }
  }

  // Fallback for environments that strip named flags.
  if (normalizedArgs.length >= 2) {
    const [input, output] = normalizedArgs;

    if (input && output) {
      return { input, output };
    }
  }

  throw new Error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
}

function toBatchError(error: unknown): BatchError {
  if (error instanceof Error) {
    return {
      code: 'BATCH_CASE_FAILED',
      message: error.message,
    };
  }

  return {
    code: 'BATCH_CASE_FAILED',
    message: 'Unknown batch case failure.',
  };
}

async function evaluateCase(inputCase: BatchCase): Promise<BatchResult> {
  try {
    const kit = await generateKit({
      jd: inputCase.jd,
      companyUrl: inputCase.company_url,
      days: inputCase.days,
    });

    return {
      id: inputCase.id,
      status: 'ok',
      kit,
      error: null,
    };
  } catch (error: unknown) {
    return {
      id: inputCase.id,
      status: 'failed',
      kit: null,
      error: toBatchError(error),
    };
  }
}

async function evaluateCases(cases: BatchCase[]): Promise<BatchResult[]> {
  const results: BatchResult[] = new Array(cases.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < cases.length) {
      const index = nextIndex;
      nextIndex += 1;

      const inputCase = cases[index];

      if (!inputCase) {
        continue;
      }

      results[index] = await evaluateCase(inputCase);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, cases.length) }, () => worker()));

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input);
  const outputPath = resolve(args.output);

  const rawInput = await readFile(inputPath, 'utf8');
  const parsedInput: unknown = JSON.parse(rawInput);
  const cases = batchInputSchema.parse(parsedInput);

  const results = await evaluateCases(cases);

  const output: BatchOutput = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const failedCount = results.filter((result) => result.status === 'failed').length;

  console.log(`Evaluated ${results.length} case(s); ${failedCount} failed. Output: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error('Batch evaluator failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
