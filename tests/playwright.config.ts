import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL || 'https://wegent.intra.weibo.com'

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Use saved authentication state
    storageState: './.auth/user.json',
  },

  // Timeout settings
  timeout: 120000, // 2 minutes for each test
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
