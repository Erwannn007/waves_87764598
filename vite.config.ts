import { defineConfig } from 'vitest/config';

// Le site est servi sous https://erwannn007.github.io/waves_87764598/ : tous les chemins sont préfixés.
export default defineConfig({
  base: '/waves_87764598/',
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
