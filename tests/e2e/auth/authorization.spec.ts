import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';

test.describe('autorizacao por perfil', () => {
  test('professor nao acessa rotas administrativas', async ({ page }) => {
    await loginAs(page, testUsers.professor);
    await page.goto(appPaths.admin.reservas);
    await expect(page).toHaveURL(/not-found|404/);
  });

  test('admin acessa telas administrativas', async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto(appPaths.admin.salas);
    await expect(page).toHaveURL(/\/admin\/salas/);
    await page.goto(appPaths.admin.usuarios);
    await expect(page).toHaveURL(/\/admin\/usuarios/);
  });
});
