import { test } from '@playwright/test';
import { testUsers } from '../fixtures/test-users';
import { loginAs } from '../support/auth';
import { expectFastPaginatedEndpoint } from './support/performance';

test.describe('performance - APIs paginadas', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    try {
      await loginAs(page, testUsers.admin);
    } catch {
      // Warm-up only: the real tests below still validate that login works.
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.admin);
  });

  test('mantem reservas administrativas rapidas e paginadas', async ({ page }) => {
    await expectFastPaginatedEndpoint(
      page,
      '/api/bookings?paginated=true&page=1&limit=10&sort=desc',
      10,
    );
  });

  test('mantem pendencias administrativas compactas', async ({ page }) => {
    await expectFastPaginatedEndpoint(
      page,
      '/api/bookings?paginated=true&page=1&limit=4&sort=asc&status=PENDENTE',
      4,
    );
  });

  test('mantem usuarios rapidos e paginados', async ({ page }) => {
    await expectFastPaginatedEndpoint(page, '/api/users?paginated=true&page=1&limit=10', 10);
  });

  test('mantem alunos rapidos, filtraveis e paginados', async ({ page }) => {
    await expectFastPaginatedEndpoint(
      page,
      '/api/users?role=ALUNO&paginated=true&page=1&limit=10',
      10,
    );
  });

  test('mantem notificacoes com payload limitado', async ({ page }) => {
    await expectFastPaginatedEndpoint(page, '/api/notifications?paginated=true&page=1&limit=20', 20);
  });
});
