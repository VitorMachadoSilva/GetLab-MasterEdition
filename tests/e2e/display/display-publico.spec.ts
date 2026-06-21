import { expect, test } from '@playwright/test';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('display publico', () => {
  test('abre sem login', async ({ page }) => {
    await page.goto(appPaths.display);
    await expect(page).not.toHaveURL(/\/login/);
    await saveEvidence(page, 'display/publico', 'display-sem-login');
  });

  test('nao exibe reservas privadas ou pendentes', async ({ page }) => {
    test.fixme(true, 'Depende de seed com reservas aprovadas, pendentes e rejeitadas.');
    await page.goto(appPaths.display);
  });
});
