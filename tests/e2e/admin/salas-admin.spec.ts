import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { testRooms } from '../../fixtures/test-data';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('admin - salas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto(appPaths.admin.salas);
  });

  test('mostra tela de gerenciamento de salas', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/salas/);
    await saveEvidence(page, 'admin/salas', 'lista');
  });

  test('cria sala valida', async ({ page }) => {
    test.fixme(true, 'Preencher seletores finais do modal de sala.');
    await page.getByRole('button', { name: /nova sala/i }).click();
    await page.getByLabel(/nome da sala/i).fill(testRooms.availableLab.name);
  });

  test('salva predio vazio como nao informado', async ({ page }) => {
    test.fixme(true, 'Depende de criacao de sala via UI ou API.');
  });

  test('exibe equipamentos como chips', async ({ page }) => {
    test.fixme(true, 'Depende de sala cadastrada com equipamentos.');
  });
});
