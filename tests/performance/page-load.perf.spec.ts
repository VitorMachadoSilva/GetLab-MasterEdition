import { test } from '@playwright/test';
import { testUsers } from '../fixtures/test-users';
import { loginAs } from '../support/auth';
import { expectFastPageLoad } from './support/performance';

test.describe('performance - carregamento de telas administrativas', () => {
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

  test('abre o painel administrativo dentro do limite', async ({ page }) => {
    await expectFastPageLoad(page, '/admin');
  });

  test('abre gerenciamento de usuarios dentro do limite', async ({ page }) => {
    await expectFastPageLoad(page, '/admin/usuarios');
  });

  test('abre gerenciamento de alunos dentro do limite', async ({ page }) => {
    await expectFastPageLoad(page, '/admin/alunos');
  });

  test('abre relatorios dentro do limite', async ({ page }) => {
    await expectFastPageLoad(page, '/admin/relatorios');
  });

  test('abre nova reserva com horario do servidor dentro do limite', async ({ page }) => {
    await expectFastPageLoad(page, '/professor/nova-reserva');
  });
});
