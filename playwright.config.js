import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000';
const viteURL = process.env.E2E_VITE_URL ?? 'http://localhost:5173/@vite/client';
const skipWebServer = process.env.E2E_SKIP_WEBSERVER === '1';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 45_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'tests/e2e-report' }],
    ],
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        acceptDownloads: true,
    },
    webServer: skipWebServer
        ? undefined
        : [
              {
                  command: 'php artisan serve --host=127.0.0.1 --port=8000',
                  url: baseURL,
                  reuseExistingServer: true,
                  timeout: 120_000,
              },
              {
                  command: 'npx vite --host localhost --port 5173 --strictPort',
                  url: viteURL,
                  reuseExistingServer: true,
                  timeout: 120_000,
              },
          ],
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
