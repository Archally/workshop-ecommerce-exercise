import { defineConfig } from 'vitest/config';

/**
 * The orders service's own test cases, run against the running service.
 *
 * Separate from vitest.local.config.ts on purpose: that one runs only what `local:generate` writes,
 * and the recorded beat must read the same with or without these. See
 * orders-service/order-status.test.ts for what a run leaves in the shop.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    root: './orders-service',
    include: ['**/*.test.ts'],
    reporters: ['verbose'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // One file against one shared service: nothing runs in parallel.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
