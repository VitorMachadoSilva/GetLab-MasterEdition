import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('perfil', () => {
  test('professor visualiza perfil', async ({ page }) => {
    await loginAs(page, testUsers.professor);
    await page.goto(appPaths.perfil);
    await expect(page).toHaveURL(/\/perfil/);
    await saveEvidence(page, 'perfil/professor', 'perfil');
  });

  test('usuario comum nao altera role por payload manual', async ({ page }) => {
    test.fixme(true, 'Implementar com chamada direta a API usando sessao do usuario.');
  });
});
