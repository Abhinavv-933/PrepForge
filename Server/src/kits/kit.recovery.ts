import { KitModel } from '../models/kit.model.js';

export async function recoverInterruptedKits(): Promise<void> {
  const result = await KitModel.updateMany(
    {
      'generation.status': 'running',
    },
    {
      $set: {
        'generation.status': 'failed',
        'generation.step': 'recovery',
        'generation.error': {
          code: 'GENERATION_INTERRUPTED',
          message: 'Generation was interrupted by a server restart.',
        },
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.log(`Marked ${result.modifiedCount} interrupted kit(s) as failed.`);
  }
}
