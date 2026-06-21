import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('admin - reservas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto(appPaths.admin.reservas);
  });

  test('mostra painel de solicitacoes', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
    await saveEvidence(page, 'admin/reservas', 'painel');
  });

  test('pagina solicitacoes pendentes', async ({ page }) => {
    test.fixme(true, 'Depende de seed com mais solicitacoes pendentes que o limite por pagina.');
  });

  test('aprova reserva pendente', async ({ page }) => {
    test.fixme(true, 'Depende de reserva pendente criada no seed.');
  });

  test('rejeita reserva pendente com motivo', async ({ page }) => {
    test.fixme(true, 'Depende de reserva pendente criada no seed.');
  });

  test('impede rejeicao sem motivo', async ({ page }) => {
    test.fixme(true, 'Depende de reserva pendente criada no seed.');
  });
});
