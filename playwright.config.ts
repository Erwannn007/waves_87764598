import { defineConfig, devices } from '@playwright/test';

// Teste le build de production (même chemin de base que GitHub Pages) en émulation mobile paysage.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/waves_87764598/', screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/waves_87764598/', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 14 landscape'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7 landscape'] } },
  ],
});
