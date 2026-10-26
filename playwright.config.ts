import { defineConfig, devices } from '@playwright/test';

// Teste le build de production (même chemin de base que GitHub Pages) en émulation mobile paysage.
// E2E_BASE_URL=https://erwannn007.github.io/waves_87764598/ teste directement le site publié.
const remote = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  globalTimeout: 6 * 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: remote ?? 'http://localhost:4173/waves_87764598/', screenshot: 'only-on-failure' },
  webServer: remote ? undefined : { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/waves_87764598/', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 14 landscape'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7 landscape'] } },
  ],
});
