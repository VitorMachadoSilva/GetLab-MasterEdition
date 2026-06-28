import { expect, type Page } from '@playwright/test';

export type TimedJsonResponse = {
  status: number;
  duration: number;
  body: any;
};

function readLimitFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const performanceLimits = {
  apiMaxMs: readLimitFromEnv('PERF_API_MAX_MS', 2500),
  pageMaxMs: readLimitFromEnv('PERF_PAGE_MAX_MS', 6000),
} as const;

export async function measureJsonEndpoint(page: Page, url: string): Promise<TimedJsonResponse> {
  return page.evaluate(async (endpoint) => {
    const startedAt = performance.now();
    const response = await fetch(endpoint);
    const body = await response.json().catch(() => null);

    return {
      status: response.status,
      duration: performance.now() - startedAt,
      body,
    };
  }, url);
}

export async function expectFastPaginatedEndpoint(
  page: Page,
  url: string,
  expectedLimit: number,
) {
  await measureJsonEndpoint(page, url);

  const result = await measureJsonEndpoint(page, url);

  expect(result.status, `${url} deve responder com sucesso`).toBe(200);
  expect(result.duration, `${url} demorou ${Math.round(result.duration)}ms`).toBeLessThanOrEqual(
    performanceLimits.apiMaxMs,
  );

  expect(result.body).toEqual(
    expect.objectContaining({
      data: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      limit: expectedLimit,
      pageCount: expect.any(Number),
    }),
  );
  expect(result.body.data.length, `${url} deve respeitar o limite paginado`).toBeLessThanOrEqual(
    expectedLimit,
  );
}

export async function expectFastPageLoad(page: Page, path: string) {
  const startedAt = Date.now();
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  const duration = Date.now() - startedAt;

  expect(response?.status(), `${path} deve abrir sem erro`).toBeLessThan(400);
  expect(duration, `${path} demorou ${duration}ms`).toBeLessThanOrEqual(
    performanceLimits.pageMaxMs,
  );
}
