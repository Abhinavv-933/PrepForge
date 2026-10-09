import { KitModel } from '../models/kit.model.js';
import { generateKit } from '../services/pipeline/generatekit.js';
import type { GenerateKitInput } from '../services/pipeline/types.js';

export async function runKitGeneration(
  kitId: string,
  input: GenerateKitInput,
): Promise<void> {
  await KitModel.updateOne(
    { _id: kitId },
    {
      $set: {
        'generation.status': 'running',
        'generation.step': 'initializing',
        'generation.progress': 0,
        'generation.error': null,
      },
    },
  );

  try {
    const kit = await generateKit(input, {
      onProgress: async ({ step, progress }) => {
        await KitModel.updateOne(
          { _id: kitId },
          {
            $set: {
              'generation.step': step,
              'generation.progress': progress,
            },
          },
        );
      },
    });

    await KitModel.updateOne(
      { _id: kitId },
      {
        $set: {
          kit,
          'generation.status': 'done',
          'generation.step': 'complete',
          'generation.progress': 100,
          'generation.error': null,
        },
      },
    );
  } catch (error: unknown) {
    console.error(
      `Kit generation failed for ${kitId}:`,
      error,
    );

    await KitModel.updateOne(
      { _id: kitId },
      {
        $set: {
          'generation.status': 'failed',
          'generation.step': 'failed',
          'generation.error': {
            code: 'GENERATION_FAILED',
            message: 'Kit generation failed.',
          },
        },
      },
    );
  }
}