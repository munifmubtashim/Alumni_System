import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// One Vitest project for api, businessLogic and dal (ADR-05).
export default defineConfig({
  resolve: {
    alias: {
      // Test against source, not the compiled dist/ that package.json points at.
      '@alumni/businesslogic': fileURLToPath(
        new URL('./src/businessLogic/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
    // Set before any module loads: UserController reads JWT_SECRET at import time,
    // and dotenv never overrides variables that are already set.
    env: {
      JWT_SECRET: 'test-jwt-secret',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'alumni_test',
      DB_USER: 'test',
      DB_PASSWORD: 'test',
    },
  },
});
