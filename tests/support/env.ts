export const appEnv = {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
  screenshotRoot: 'test-results/visual',
} as const;
