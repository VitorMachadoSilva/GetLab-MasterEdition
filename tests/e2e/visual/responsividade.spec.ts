import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

const publicPages = [
  ['login', appPaths.login],
  ['display', appPaths.display],
] as const;

const adminPages = [
  ['admin/reservas', appPaths.admin.reservas],
  ['admin/salas', appPaths.admin.salas],
  ['admin/usuarios', appPaths.admin.usuarios],
] as const;

const professorPages = [
  ['professor/nova-reserva', appPaths.professor.novaReserva],
  ['professor/minhas-reservas', appPaths.professor.minhasReservas],
  ['perfil/professor', appPaths.perfil],
] as const;

test.describe('visual - paginas publicas', () => {
  for (const [name, path] of publicPages) {
    test(`captura ${name}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/erro-improvavel/);
      await saveEvidence(page, `${name}/${testInfo.project.name}`, 'viewport');
    });
  }
});

test.describe('visual - paginas admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.admin);
  });

  for (const [name, path] of adminPages) {
    test(`captura ${name}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await saveEvidence(page, `${name}/${testInfo.project.name}`, 'viewport');
    });
  }
});

test.describe('visual - paginas professor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.professor);
  });

  for (const [name, path] of professorPages) {
    test(`captura ${name}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await saveEvidence(page, `${name}/${testInfo.project.name}`, 'viewport');
    });
  }
});
