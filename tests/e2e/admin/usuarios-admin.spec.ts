import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('admin - usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto(appPaths.admin.usuarios);
  });

  test('mostra busca, filtros e lista de usuarios', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/usuarios/);
    await saveEvidence(page, 'admin/usuarios', 'lista');
  });

  test('filtra usuarios por tipo', async ({ page }) => {
    await page.getByRole('button', { name: /professores/i }).click();
    await expect(page.getByText(/mostrando/i)).toBeVisible();
  });

  test('cria professor com email institucional valido', async ({ page }) => {
    test.fixme(true, 'Depende de seed/limpeza para evitar duplicidade.');
  });

  test('bloqueia email fora da regra do perfil', async ({ page }) => {
    test.fixme(true, 'Depende de validacao final da mensagem exibida.');
  });

  test('edita admin interno sem alterar CPF especial', async ({ page }) => {
    test.fixme(true, 'Depende de admin interno presente no banco de teste.');
  });
});
