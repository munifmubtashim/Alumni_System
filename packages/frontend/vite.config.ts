import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// The repo-root .env is shared with the API server.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  // Only PORT is read from the root .env, and only here in config, to point the
  // dev proxy at the API. Nothing else from that file (DB credentials,
  // JWT_SECRET) is used or exposed; Vite ships only VITE_* vars to the client.
  // A blank `PORT=` falls back to 3000 too, not just a missing one.
  const envPort = loadEnv(mode, repoRoot, '').PORT;
  const apiPort = envPort === undefined || envPort === '' ? '3000' : envPort;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      // Globals are off: tests import describe/it/expect from 'vitest'.
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // scripts/** tests are Node-only; they opt out of jsdom with a
      // `// @vitest-environment node` comment (Vitest 5 has no environmentMatchGlobs).
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
      // Stable, readable class names in tests (e.g. "primary", not "_primary_x1y2").
      css: { modules: { classNameStrategy: 'non-scoped' } },
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/test/**', '**/*.test.*'],
      },
    },
  };
});
