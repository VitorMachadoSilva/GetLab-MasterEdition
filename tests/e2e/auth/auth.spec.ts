import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs, expectProtectedRouteRedirect } from '../../support/auth';
import { appPaths } from '../../support/paths';

test.describe('autenticacao e protecao de rotas', () => {
  test('redireciona usuario sem sessao para login', async ({ page }) => {
    await expectProtectedRouteRedirect(page, appPaths.dashboard);
    await expectProtectedRouteRedirect(page, appPaths.admin.reservas);
    await expectProtectedRouteRedirect(page, appPaths.professor.novaReserva);
  });

  test('professor faz login e entra no painel', async ({ page }) => {
    await loginAs(page, testUsers.professor);
    await expect(page).toHaveURL(/\/dashboard|\/professor/);
  });

  test('admin faz login e acessa area administrativa', async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto(appPaths.admin.reservas);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('login invalido permanece na tela de login', async ({ page }) => {
    await page.goto(appPaths.login);
    await page.getByLabel(/email institucional/i).fill('invalido@fmpsc.edu.br');
    await page.getByLabel(/senha/i).fill('senha-incorreta');
    await page.getByRole('button', { name: /entrar no sistema/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
