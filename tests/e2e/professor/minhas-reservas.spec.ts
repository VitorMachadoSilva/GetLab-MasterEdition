import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('professor - minhas reservas', () => {
  test('lista reservas do professor logado', async ({ page }) => {
    await loginAs(page, testUsers.professor);
    await page.goto(appPaths.professor.minhasReservas);
    await expect(page).toHaveURL(/\/professor\/minhas-reservas/);
    await saveEvidence(page, 'professor/minhas-reservas', 'lista');
  });

  test('professor nao visualiza reservas de outro professor', async ({ page }) => {
    test.fixme(true, 'Depende de seed com reservas de dois professores.');
  });
});
