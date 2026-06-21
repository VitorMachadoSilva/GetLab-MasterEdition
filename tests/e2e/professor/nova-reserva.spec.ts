import { expect, test } from '@playwright/test';
import { testUsers } from '../../fixtures/test-users';
import { testBookings } from '../../fixtures/test-data';
import { loginAs } from '../../support/auth';
import { appPaths } from '../../support/paths';
import { saveEvidence } from '../../support/screenshots';

test.describe('professor - nova reserva', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.professor);
    await page.goto(appPaths.professor.novaReserva);
  });

  test('mostra agenda de disponibilidade', async ({ page }) => {
    await expect(page).toHaveURL(/\/professor\/nova-reserva/);
    await saveEvidence(page, 'professor/nova-reserva', 'agenda-disponibilidade');
  });

  test('cria solicitacao valida', async ({ page }) => {
    test.fixme(true, 'Preencher quando existir seed de sala e data livre.');
    await page.getByLabel(/disciplina|curso/i).fill(testBookings.validCourse);
  });

  test('bloqueia conflito de horario', async ({ page }) => {
    test.fixme(true, 'Depende de reserva existente no mesmo horario.');
  });

  test('bloqueia capacidade acima da sala', async ({ page }) => {
    test.fixme(true, 'Depende de sala pequena no seed.');
  });
});
