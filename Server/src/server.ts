import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './db/connect.js';
import { recoverInterruptedKits } from './kits/kit.recovery.js';

async function startServer(): Promise<void> {
  await connectDatabase();

  await recoverInterruptedKits();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`PrepForge server running on port ${env.PORT}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Failed to start PrepForge server:', error);
  process.exit(1);
});
